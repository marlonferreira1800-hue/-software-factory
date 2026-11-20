import { BadRequestException, Injectable } from '@nestjs/common';
import { GenerationMode, Prisma } from '@prisma/client';
import {
  AppBlueprint,
  CreateHandoffPromptDto,
  GenerateBlueprintRequestDto,
  GenerateCodeRequestDto,
  HandoffPromptPackage,
  ImportHandoffResponseDto,
  ProjectArtifactsBundleResponse,
  SoftwareProjectResponse,
  UserRole,
} from '@software-factory/shared';
import { BuiltinOfflineAdapter } from '../ai-providers/adapters/builtin-offline.adapter';
import { HttpLlmAdapter } from '../ai-providers/adapters/http-llm.adapter';
import { LocalCliAdapter } from '../ai-providers/adapters/local-cli.adapter';
import { SubscriptionBridgeAdapter } from '../ai-providers/adapters/subscription-bridge.adapter';
import { AiProvidersService } from '../ai-providers/ai-providers.service';
import { ProjectsService } from '../projects/projects.service';
import { CodeFactoryEngine } from './codegen/code-factory.engine';
import { GeneratorRepository } from './generator.repository';

@Injectable()
export class GeneratorService {
  constructor(
    private readonly repository: GeneratorRepository,
    private readonly projectsService: ProjectsService,
    private readonly aiProvidersService: AiProvidersService,
    private readonly builtinOfflineAdapter: BuiltinOfflineAdapter,
    private readonly subscriptionBridgeAdapter: SubscriptionBridgeAdapter,
    private readonly localCliAdapter: LocalCliAdapter,
    private readonly httpLlmAdapter: HttpLlmAdapter,
    private readonly codeFactoryEngine: CodeFactoryEngine,
  ) {}

  async generateBlueprint(
    projectId: string,
    dto: GenerateBlueprintRequestDto,
    user: { id: string; role: UserRole },
  ): Promise<{ project: SoftwareProjectResponse; blueprint: AppBlueprint }> {
    const startTime = Date.now();
    const project = await this.projectsService.findAuthorizedEntity(projectId, user);
    const resolvedProvider = await this.aiProvidersService.resolveForExecution(
      dto.providerId || project.aiProviderId,
      project.ownerId,
    );

    let mode: GenerationMode = 'AUTOMATIC_ENGINE';
    if (resolvedProvider) {
      if (resolvedProvider.authMode === 'BROWSER_HANDOFF') {
        throw new BadRequestException(
          `O conector "${resolvedProvider.name}" usa o modo Ponte de Assinatura Web. Use o botão "Gerar Pedido para minha IA" para copiar o prompt e colar a resposta do seu chat.`,
        );
      }
      if (resolvedProvider.authMode === 'LOCAL_CLI') {
        mode = 'LOCAL_CLI';
      } else if (
        resolvedProvider.authMode === 'API_KEY' ||
        resolvedProvider.authMode === 'LOCAL_SERVER'
      ) {
        mode = 'API_DIRECT';
      }
    }

    const job = await this.repository.createJob({
      projectId: project.id,
      providerId: resolvedProvider?.id || null,
      triggeredById: user.id,
      mode,
      status: 'PENDING',
      promptUsed: dto.prompt,
    });

    try {
      let blueprint: AppBlueprint;
      let rawResponse = '';

      if (!resolvedProvider || resolvedProvider.providerType === 'BUILTIN_OFFLINE') {
        blueprint = this.builtinOfflineAdapter.generateFromPrompt({
          projectName: project.name,
          prompt: dto.prompt,
          targetAudience: project.targetAudience || undefined,
        });
        rawResponse = JSON.stringify(blueprint, null, 2);
      } else {
        const handoff = this.subscriptionBridgeAdapter.buildHandoffPrompt({
          projectName: project.name,
          userPrompt: dto.prompt,
          targetPlatform: 'GENERIC',
        });

        rawResponse =
          mode === 'LOCAL_CLI'
            ? await this.localCliAdapter.runPrompt(
                resolvedProvider.providerType,
                handoff.superPrompt,
              )
            : await this.httpLlmAdapter.runPrompt(resolvedProvider, handoff.superPrompt);

        blueprint = this.subscriptionBridgeAdapter.parseBlueprintFromAiText(rawResponse);
      }

      await this.repository.saveProjectBlueprint(
        project.id,
        blueprint as unknown as Prisma.InputJsonValue,
        'DESIGNED',
      );

      await this.repository.updateJob(job.id, {
        status: 'COMPLETED',
        rawResponse,
        durationMs: Date.now() - startTime,
      });

      const updatedProject = await this.projectsService.findOne(project.id, user);
      return { project: updatedProject, blueprint };
    } catch (error) {
      await this.repository.updateJob(job.id, {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  async createHandoffPrompt(
    projectId: string,
    dto: CreateHandoffPromptDto,
    user: { id: string; role: UserRole },
  ): Promise<HandoffPromptPackage> {
    const project = await this.projectsService.findAuthorizedEntity(projectId, user);
    const pkg = this.subscriptionBridgeAdapter.buildHandoffPrompt({
      projectName: project.name,
      userPrompt: dto.prompt,
      targetPlatform: dto.targetPlatform,
    });

    const job = await this.repository.createJob({
      projectId: project.id,
      providerId: project.aiProviderId || null,
      triggeredById: user.id,
      mode: 'SUBSCRIPTION_HANDOFF',
      status: 'AWAITING_HANDOFF',
      promptUsed: pkg.superPrompt,
      handoffInstructions: pkg.platformInstructions,
    });

    return {
      ...pkg,
      jobId: job.id,
    };
  }

  async importHandoffResponse(
    projectId: string,
    dto: ImportHandoffResponseDto,
    user: { id: string; role: UserRole },
  ): Promise<{ project: SoftwareProjectResponse; blueprint: AppBlueprint }> {
    const startTime = Date.now();
    const project = await this.projectsService.findAuthorizedEntity(projectId, user);
    const blueprint = this.subscriptionBridgeAdapter.parseBlueprintFromAiText(
      dto.rawAiResponse,
    );

    await this.repository.saveProjectBlueprint(
      project.id,
      blueprint as unknown as Prisma.InputJsonValue,
      'DESIGNED',
    );

    await this.repository.createJob({
      projectId: project.id,
      providerId: project.aiProviderId || null,
      triggeredById: user.id,
      mode: 'SUBSCRIPTION_HANDOFF',
      status: 'COMPLETED',
      promptUsed: `Importação manual via assinatura ${dto.targetPlatform}`,
      rawResponse: dto.rawAiResponse,
      durationMs: Date.now() - startTime,
    });

    const updated = await this.projectsService.findOne(project.id, user);
    return { project: updated, blueprint };
  }

  async generateCode(
    projectId: string,
    dto: GenerateCodeRequestDto,
    user: { id: string; role: UserRole },
  ): Promise<ProjectArtifactsBundleResponse> {
    const startTime = Date.now();
    const project = await this.projectsService.findAuthorizedEntity(projectId, user);

    const blueprint =
      (project.blueprintJson as unknown as AppBlueprint | null) ||
      this.builtinOfflineAdapter.generateFromPrompt({
        projectName: project.name,
        prompt: project.plainIdea,
        targetAudience: project.targetAudience || undefined,
      });

    if (!project.blueprintJson) {
      await this.repository.saveProjectBlueprint(
        project.id,
        blueprint as unknown as Prisma.InputJsonValue,
        'DESIGNED',
      );
    }

    const generatedFiles = this.codeFactoryEngine.generateAllFiles(blueprint, {
      includeDocker: dto.includeDocker,
      includeAiPack: dto.includeAiPack,
    });

    const job = await this.repository.createJob({
      projectId: project.id,
      providerId: project.aiProviderId || null,
      triggeredById: user.id,
      mode: 'AUTOMATIC_ENGINE',
      status: 'COMPLETED',
      promptUsed: `Compilação de código Full-Stack (${generatedFiles.length} arquivos)`,
      durationMs: Date.now() - startTime,
      filesGeneratedJson: generatedFiles.map((f) => f.filePath),
    });

    await this.repository.replaceGeneratedArtifacts({
      projectId: project.id,
      jobId: job.id,
      artifacts: generatedFiles,
    });

    return this.getArtifactsBundle(project.id, user);
  }

  async getArtifactsBundle(
    projectId: string,
    user: { id: string; role: UserRole },
  ): Promise<ProjectArtifactsBundleResponse> {
    const project = await this.projectsService.findAuthorizedEntity(projectId, user);
    const { artifacts, jobs } = await this.repository.findArtifactsAndJobs(project.id);

    return {
      projectId: project.id,
      blueprint: (project.blueprintJson as unknown as AppBlueprint) || null,
      artifacts: artifacts.map((art) => ({
        id: art.id,
        filePath: art.filePath,
        layer: art.layer,
        language: art.language,
        content: art.content,
        sizeBytes: art.sizeBytes,
        createdAt: art.createdAt.toISOString(),
      })),
      jobs: jobs.map((job) => ({
        id: job.id,
        projectId: job.projectId,
        providerId: job.providerId,
        mode: job.mode,
        status: job.status,
        promptUsed: job.promptUsed,
        errorMessage: job.errorMessage,
        durationMs: job.durationMs,
        createdAt: job.createdAt.toISOString(),
      })),
    };
  }

  async buildZipDownload(
    projectId: string,
    user: { id: string; role: UserRole },
  ): Promise<{ filename: string; buffer: Buffer }> {
    const project = await this.projectsService.findAuthorizedEntity(projectId, user);
    let { artifacts } = await this.repository.findArtifactsAndJobs(project.id);

    if (artifacts.length === 0) {
      await this.generateCode(
        project.id,
        { includeDocker: true, includeAiPack: true },
        user,
      );
      const refreshed = await this.repository.findArtifactsAndJobs(project.id);
      artifacts = refreshed.artifacts;
    }

    const buffer = await this.codeFactoryEngine.createZipArchive(
      artifacts.map((a) => ({ filePath: a.filePath, content: a.content })),
      project.slug,
    );

    await this.repository.markProjectExported(project.id);

    return {
      filename: `${project.slug}.zip`,
      buffer,
    };
  }
}

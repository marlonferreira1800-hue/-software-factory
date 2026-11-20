import { Injectable } from '@nestjs/common';
import {
  ArtifactLayer,
  GeneratedArtifact,
  GenerationJob,
  GenerationJobStatus,
  GenerationMode,
  Prisma,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GeneratorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(data: {
    projectId: string;
    providerId?: string | null;
    triggeredById: string;
    mode: GenerationMode;
    status: GenerationJobStatus;
    promptUsed: string;
    handoffInstructions?: string | null;
    rawResponse?: string | null;
    errorMessage?: string | null;
    durationMs?: number | null;
    filesGeneratedJson?: Prisma.InputJsonValue;
  }): Promise<GenerationJob> {
    return this.prisma.generationJob.create({ data });
  }

  async updateJob(
    id: string,
    data: Prisma.GenerationJobUpdateInput,
  ): Promise<GenerationJob> {
    return this.prisma.generationJob.update({ where: { id }, data });
  }

  async saveProjectBlueprint(
    projectId: string,
    blueprintJson: Prisma.InputJsonValue,
    status: ProjectStatus = 'DESIGNED',
  ): Promise<void> {
    await this.prisma.softwareProject.update({
      where: { id: projectId },
      data: {
        blueprintJson,
        status,
      },
    });
  }

  async replaceGeneratedArtifacts(params: {
    projectId: string;
    jobId: string;
    artifacts: Array<{
      filePath: string;
      layer: ArtifactLayer;
      language: string;
      content: string;
      sizeBytes: number;
    }>;
  }): Promise<GeneratedArtifact[]> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.generatedArtifact.deleteMany({
        where: { projectId: params.projectId },
      });

      await tx.generatedArtifact.createMany({
        data: params.artifacts.map((art) => ({
          projectId: params.projectId,
          jobId: params.jobId,
          filePath: art.filePath,
          layer: art.layer,
          language: art.language,
          content: art.content,
          sizeBytes: art.sizeBytes,
        })),
      });

      await tx.softwareProject.update({
        where: { id: params.projectId },
        data: {
          status: 'GENERATED',
          generatedFilesCount: params.artifacts.length,
          lastGeneratedAt: new Date(),
        },
      });

      return tx.generatedArtifact.findMany({
        where: { projectId: params.projectId },
        orderBy: [{ layer: 'asc' }, { filePath: 'asc' }],
      });
    });
  }

  async findArtifactsAndJobs(projectId: string): Promise<{
    artifacts: GeneratedArtifact[];
    jobs: GenerationJob[];
  }> {
    const [artifacts, jobs] = await Promise.all([
      this.prisma.generatedArtifact.findMany({
        where: { projectId },
        orderBy: [{ layer: 'asc' }, { filePath: 'asc' }],
      }),
      this.prisma.generationJob.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    return { artifacts, jobs };
  }

  async markProjectExported(projectId: string): Promise<void> {
    await this.prisma.softwareProject.update({
      where: { id: projectId },
      data: { status: 'EXPORTED' },
    });
  }
}

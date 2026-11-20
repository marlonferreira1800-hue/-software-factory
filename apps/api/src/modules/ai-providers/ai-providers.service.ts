import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProviderConnection } from '@prisma/client';
import {
  AiConnectionTestResult,
  AiProviderAuthMode,
  AiProviderQueryDto,
  AiProviderResponse,
  AiProviderType,
  CreateAiProviderDto,
  PaginatedResult,
  UpdateAiProviderDto,
  UserRole,
} from '@software-factory/shared';
import {
  decryptSecret,
  encryptSecret,
  maskSecret,
} from '../../common/utils/crypto.util';
import { toPaginatedResult } from '../../common/utils/pagination.util';
import { slugify } from '../../common/utils/slugify.util';
import { ResolvedProviderConfig } from './adapters/ai-adapter.interface';
import { HttpLlmAdapter } from './adapters/http-llm.adapter';
import { LocalCliAdapter } from './adapters/local-cli.adapter';
import { AiProvidersRepository } from './ai-providers.repository';

@Injectable()
export class AiProvidersService {
  constructor(
    private readonly repository: AiProvidersRepository,
    private readonly configService: ConfigService,
    private readonly localCliAdapter: LocalCliAdapter,
    private readonly httpLlmAdapter: HttpLlmAdapter,
  ) {}

  private get encryptionSecret(): string {
    return (
      this.configService.get<string>('ENCRYPTION_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'fabrica-livre-aes-dev-secret-2026'
    );
  }

  async list(
    query: AiProviderQueryDto,
    user: { id: string; role: UserRole },
  ): Promise<PaginatedResult<AiProviderResponse>> {
    const { items, total } = await this.repository.findManyPaginated(query, user);
    return toPaginatedResult(
      items.map((item) => this.toResponse(item)),
      total,
      query.page,
      query.pageSize,
    );
  }

  async findOne(
    id: string,
    user: { id: string; role: UserRole },
  ): Promise<AiProviderResponse> {
    const provider = await this.findAuthorizedEntity(id, user);
    return this.toResponse(provider);
  }

  async create(
    dto: CreateAiProviderDto,
    ownerId: string,
  ): Promise<AiProviderResponse> {
    if (dto.isDefault) {
      await this.repository.clearDefaultForOwner(ownerId);
    }

    const baseSlug = slugify(dto.name);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    const hasKey = Boolean(dto.apiKey && dto.apiKey.trim().length > 0);

    const created = await this.repository.create({
      name: dto.name,
      slug: uniqueSlug,
      providerType: dto.providerType,
      authMode: dto.authMode,
      subscriptionBrand: dto.subscriptionBrand,
      description: dto.description || null,
      modelName: dto.modelName || null,
      baseUrl: dto.baseUrl || null,
      cliCommand: dto.cliCommand || null,
      encryptedApiKey: hasKey
        ? encryptSecret(dto.apiKey!.trim(), this.encryptionSecret)
        : null,
      maskedApiKey: hasKey ? maskSecret(dto.apiKey!.trim()) : null,
      isDefault: dto.isDefault,
      isActive: dto.isActive,
      ownerId,
    });

    return this.toResponse(created);
  }

  async update(
    id: string,
    dto: UpdateAiProviderDto,
    user: { id: string; role: UserRole },
  ): Promise<AiProviderResponse> {
    const existing = await this.findAuthorizedEntity(id, user);

    if (dto.isDefault) {
      await this.repository.clearDefaultForOwner(existing.ownerId);
    }

    const updateData: Record<string, unknown> = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.providerType !== undefined ? { providerType: dto.providerType } : {}),
      ...(dto.authMode !== undefined ? { authMode: dto.authMode } : {}),
      ...(dto.subscriptionBrand !== undefined
        ? { subscriptionBrand: dto.subscriptionBrand }
        : {}),
      ...(dto.description !== undefined ? { description: dto.description || null } : {}),
      ...(dto.modelName !== undefined ? { modelName: dto.modelName || null } : {}),
      ...(dto.baseUrl !== undefined ? { baseUrl: dto.baseUrl || null } : {}),
      ...(dto.cliCommand !== undefined ? { cliCommand: dto.cliCommand || null } : {}),
      ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    if (dto.apiKey && dto.apiKey.trim().length > 0) {
      updateData.encryptedApiKey = encryptSecret(
        dto.apiKey.trim(),
        this.encryptionSecret,
      );
      updateData.maskedApiKey = maskSecret(dto.apiKey.trim());
    }

    const updated = await this.repository.update(id, updateData);
    return this.toResponse(updated);
  }

  async remove(
    id: string,
    user: { id: string; role: UserRole },
  ): Promise<{ deleted: true; id: string }> {
    await this.findAuthorizedEntity(id, user);
    await this.repository.softDelete(id);
    return { deleted: true, id };
  }

  async testConnection(
    id: string,
    user: { id: string; role: UserRole },
  ): Promise<AiConnectionTestResult> {
    const provider = await this.findAuthorizedEntity(id, user);
    const resolved = this.resolveProviderConfig(provider);

    let result: { success: boolean; message: string; details?: string };

    if (provider.providerType === 'BUILTIN_OFFLINE') {
      result = {
        success: true,
        message: 'Motor Automático Offline ativo e pronto para uso imediato.',
        details: 'Não requer chave API nem conexão externa.',
      };
    } else if (
      provider.providerType === 'SUBSCRIPTION_BRIDGE' ||
      provider.providerType === 'ANTIGRAVITY_AGENT'
    ) {
      result = {
        success: true,
        message: `Conector "${provider.subscriptionBrand}" pronto no modo Ponte Assistida de Assinatura.`,
        details: 'Você gera o pedido com 1 clique, cola na sua assinatura e importa a resposta.',
      };
    } else if (
      provider.providerType === 'CLAUDE_CLI' ||
      provider.providerType === 'GEMINI_CLI' ||
      provider.providerType === 'CODEX_CLI'
    ) {
      result = await this.localCliAdapter.testCliAvailability(
        provider.providerType as AiProviderType,
      );
    } else {
      result = await this.httpLlmAdapter.testConnection(resolved);
    }

    const testedAt = new Date();
    await this.repository.update(provider.id, {
      lastTestedAt: testedAt,
      lastTestStatus: result.success
        ? `OK: ${result.message}`
        : `Atenção: ${result.message}`,
    });

    return {
      success: result.success,
      providerId: provider.id,
      mode: provider.authMode as AiProviderAuthMode,
      message: result.message,
      details: result.details,
      testedAt: testedAt.toISOString(),
    };
  }

  async resolveForExecution(
    providerId: string | null | undefined,
    ownerId: string,
  ): Promise<ResolvedProviderConfig | null> {
    const entity = providerId
      ? await this.repository.findById(providerId)
      : await this.repository.findDefaultForOwner(ownerId);

    if (!entity) return null;
    if (entity.ownerId !== ownerId) return null;
    return this.resolveProviderConfig(entity);
  }

  private resolveProviderConfig(provider: AiProviderConnection): ResolvedProviderConfig {
    let decryptedKey: string | null = null;
    if (provider.encryptedApiKey) {
      try {
        decryptedKey = decryptSecret(provider.encryptedApiKey, this.encryptionSecret);
      } catch {
        decryptedKey = null;
      }
    }

    return {
      id: provider.id,
      name: provider.name,
      providerType: provider.providerType as AiProviderType,
      authMode: provider.authMode as AiProviderAuthMode,
      subscriptionBrand: provider.subscriptionBrand,
      modelName: provider.modelName,
      baseUrl: provider.baseUrl,
      cliCommand: provider.cliCommand,
      apiKey: decryptedKey,
    };
  }

  private async findAuthorizedEntity(
    id: string,
    user: { id: string; role: UserRole },
  ): Promise<AiProviderConnection> {
    const provider = await this.repository.findById(id);
    if (!provider) {
      throw new NotFoundException('Conector de IA não encontrado.');
    }
    if (user.role !== 'ADMIN' && provider.ownerId !== user.id) {
      throw new ForbiddenException('Você não tem acesso a este conector de IA.');
    }
    return provider;
  }

  private toResponse(entity: AiProviderConnection): AiProviderResponse {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      providerType: entity.providerType as AiProviderType,
      authMode: entity.authMode as AiProviderAuthMode,
      subscriptionBrand: entity.subscriptionBrand,
      description: entity.description,
      modelName: entity.modelName,
      baseUrl: entity.baseUrl,
      cliCommand: entity.cliCommand,
      hasApiKey: Boolean(entity.encryptedApiKey),
      maskedApiKey: entity.maskedApiKey,
      isDefault: entity.isDefault,
      isActive: entity.isActive,
      lastTestedAt: entity.lastTestedAt ? entity.lastTestedAt.toISOString() : null,
      lastTestStatus: entity.lastTestStatus,
      ownerId: entity.ownerId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

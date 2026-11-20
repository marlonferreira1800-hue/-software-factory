import { Injectable } from '@nestjs/common';
import {
  AiProviderAuthMode,
  AiProviderConnection,
  AiProviderType,
  Prisma,
} from '@prisma/client';
import { AiProviderQueryDto, UserRole } from '@software-factory/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiProvidersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    query: AiProviderQueryDto,
    user: { id: string; role: UserRole },
  ): Promise<{ items: AiProviderConnection[]; total: number }> {
    const where: Prisma.AiProviderConnectionWhereInput = {
      deletedAt: null,
      ...(user.role !== 'ADMIN' ? { ownerId: user.id } : {}),
      ...(query.providerType ? { providerType: query.providerType } : {}),
      ...(query.authMode ? { authMode: query.authMode } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { subscriptionBrand: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.aiProviderConnection.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.aiProviderConnection.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<AiProviderConnection | null> {
    return this.prisma.aiProviderConnection.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findDefaultForOwner(ownerId: string): Promise<AiProviderConnection | null> {
    return this.prisma.aiProviderConnection.findFirst({
      where: { ownerId, deletedAt: null, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async clearDefaultForOwner(ownerId: string): Promise<void> {
    await this.prisma.aiProviderConnection.updateMany({
      where: { ownerId, deletedAt: null, isDefault: true },
      data: { isDefault: false },
    });
  }

  async create(data: {
    name: string;
    slug: string;
    providerType: AiProviderType;
    authMode: AiProviderAuthMode;
    subscriptionBrand: string;
    description?: string | null;
    modelName?: string | null;
    baseUrl?: string | null;
    cliCommand?: string | null;
    encryptedApiKey?: string | null;
    maskedApiKey?: string | null;
    isDefault: boolean;
    isActive: boolean;
    ownerId: string;
  }): Promise<AiProviderConnection> {
    return this.prisma.aiProviderConnection.create({ data });
  }

  async update(
    id: string,
    data: Prisma.AiProviderConnectionUpdateInput,
  ): Promise<AiProviderConnection> {
    return this.prisma.aiProviderConnection.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<AiProviderConnection> {
    return this.prisma.aiProviderConnection.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
    });
  }
}

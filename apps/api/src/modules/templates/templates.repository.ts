import { Injectable } from '@nestjs/common';
import { AppTemplate, Prisma, TemplateCategory } from '@prisma/client';
import { TemplateQueryDto } from '@software-factory/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    query: TemplateQueryDto,
  ): Promise<{ items: AppTemplate[]; total: number }> {
    const where: Prisma.AppTemplateWhereInput = {
      deletedAt: null,
      ...(query.category ? { category: query.category } : {}),
      ...(query.isOfficial !== undefined ? { isOfficial: query.isOfficial } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { shortDescription: { contains: query.search, mode: 'insensitive' } },
              { targetAudience: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.appTemplate.findMany({
        where,
        orderBy: [{ isOfficial: 'desc' }, { usageCount: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.appTemplate.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<AppTemplate | null> {
    return this.prisma.appTemplate.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: {
    name: string;
    slug: string;
    category: TemplateCategory;
    icon: string;
    shortDescription: string;
    targetAudience: string;
    plainPromptExample: string;
    blueprintJson: Prisma.InputJsonValue;
    isOfficial: boolean;
    authorId: string;
  }): Promise<AppTemplate> {
    return this.prisma.appTemplate.create({ data });
  }

  async update(
    id: string,
    data: Prisma.AppTemplateUpdateInput,
  ): Promise<AppTemplate> {
    return this.prisma.appTemplate.update({ where: { id }, data });
  }

  async incrementUsage(id: string): Promise<void> {
    await this.prisma.appTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  async softDelete(id: string): Promise<AppTemplate> {
    return this.prisma.appTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { ProjectQueryDto, UserRole } from '@software-factory/shared';
import { PrismaService } from '../../prisma/prisma.service';

const PROJECT_INCLUDE = {
  owner: {
    select: { id: true, name: true, email: true },
  },
  aiProvider: {
    select: {
      id: true,
      name: true,
      providerType: true,
      subscriptionBrand: true,
    },
  },
} satisfies Prisma.SoftwareProjectInclude;

export type ProjectWithRelations = Prisma.SoftwareProjectGetPayload<{
  include: typeof PROJECT_INCLUDE;
}>;

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(
    query: ProjectQueryDto,
    user: { id: string; role: UserRole },
  ): Promise<{ items: ProjectWithRelations[]; total: number }> {
    const where: Prisma.SoftwareProjectWhereInput = {
      deletedAt: null,
      ...(user.role !== 'ADMIN' ? { ownerId: user.id } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { plainIdea: { contains: query.search, mode: 'insensitive' } },
              { targetAudience: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const allowedSort = ['name', 'status', 'createdAt', 'updatedAt'];
    const sortBy = query.sortBy && allowedSort.includes(query.sortBy) ? query.sortBy : 'updatedAt';

    const [items, total] = await Promise.all([
      this.prisma.softwareProject.findMany({
        where,
        include: PROJECT_INCLUDE,
        orderBy: { [sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.softwareProject.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<ProjectWithRelations | null> {
    return this.prisma.softwareProject.findFirst({
      where: { id, deletedAt: null },
      include: PROJECT_INCLUDE,
    });
  }

  async create(data: {
    name: string;
    slug: string;
    plainIdea: string;
    targetAudience: string | null;
    status: ProjectStatus;
    blueprintJson?: Prisma.InputJsonValue;
    ownerId: string;
    templateId: string | null;
    aiProviderId: string | null;
  }): Promise<ProjectWithRelations> {
    return this.prisma.softwareProject.create({
      data,
      include: PROJECT_INCLUDE,
    });
  }

  async update(
    id: string,
    data: Prisma.SoftwareProjectUpdateInput,
  ): Promise<ProjectWithRelations> {
    return this.prisma.softwareProject.update({
      where: { id },
      data,
      include: PROJECT_INCLUDE,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.softwareProject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

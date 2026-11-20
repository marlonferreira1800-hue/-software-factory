import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import {
  AppBlueprint,
  CreateProjectDto,
  PaginatedResult,
  ProjectQueryDto,
  ProjectStatus as SharedProjectStatus,
  SoftwareProjectResponse,
  UpdateProjectDto,
  UserRole,
} from '@software-factory/shared';
import { toPaginatedResult } from '../../common/utils/pagination.util';
import { slugify } from '../../common/utils/slugify.util';
import { TemplatesRepository } from '../templates/templates.repository';
import { ProjectsRepository, ProjectWithRelations } from './projects.repository';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly templatesRepository: TemplatesRepository,
  ) {}

  async list(
    query: ProjectQueryDto,
    user: { id: string; role: UserRole },
  ): Promise<PaginatedResult<SoftwareProjectResponse>> {
    const { items, total } = await this.projectsRepository.findManyPaginated(query, user);
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
  ): Promise<SoftwareProjectResponse> {
    const project = await this.findAuthorizedEntity(id, user);
    return this.toResponse(project);
  }

  async create(
    dto: CreateProjectDto,
    ownerId: string,
  ): Promise<SoftwareProjectResponse> {
    let blueprintJson: Prisma.InputJsonValue | undefined;
    let initialStatus: ProjectStatus = 'DRAFT';
    const templateId = dto.templateId ? dto.templateId.trim() : null;

    if (templateId) {
      const template = await this.templatesRepository.findById(templateId);
      if (!template) {
        throw new NotFoundException('O modelo selecionado não foi encontrado.');
      }
      const cloned = structuredClone(template.blueprintJson as Record<string, unknown>);
      cloned.appName = dto.name;
      cloned.slug = slugify(dto.name);
      blueprintJson = cloned as Prisma.InputJsonValue;
      initialStatus = 'DESIGNED';
      await this.templatesRepository.incrementUsage(template.id);
    }

    const uniqueSlug = `${slugify(dto.name)}-${Date.now().toString(36).slice(-4)}`;

    const created = await this.projectsRepository.create({
      name: dto.name,
      slug: uniqueSlug,
      plainIdea: dto.plainIdea,
      targetAudience: dto.targetAudience?.trim() || null,
      status: initialStatus,
      ...(blueprintJson ? { blueprintJson } : {}),
      ownerId,
      templateId,
      aiProviderId: dto.aiProviderId ? dto.aiProviderId.trim() : null,
    });

    return this.toResponse(created);
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    user: { id: string; role: UserRole },
  ): Promise<SoftwareProjectResponse> {
    const existing = await this.findAuthorizedEntity(id, user);

    const nextStatus =
      dto.status ??
      (dto.blueprintJson && existing.status === 'DRAFT' ? 'DESIGNED' : undefined);

    const updated = await this.projectsRepository.update(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.plainIdea !== undefined ? { plainIdea: dto.plainIdea } : {}),
      ...(dto.targetAudience !== undefined
        ? { targetAudience: dto.targetAudience || null }
        : {}),
      ...(nextStatus !== undefined ? { status: nextStatus } : {}),
      ...(dto.aiProviderId !== undefined
        ? dto.aiProviderId
          ? { aiProvider: { connect: { id: dto.aiProviderId } } }
          : { aiProvider: { disconnect: true } }
        : {}),
      ...(dto.blueprintJson !== undefined
        ? { blueprintJson: dto.blueprintJson as unknown as Prisma.InputJsonValue }
        : {}),
    });

    return this.toResponse(updated);
  }

  async remove(
    id: string,
    user: { id: string; role: UserRole },
  ): Promise<{ deleted: true; id: string }> {
    await this.findAuthorizedEntity(id, user);
    await this.projectsRepository.softDelete(id);
    return { deleted: true, id };
  }

  async findAuthorizedEntity(
    id: string,
    user: { id: string; role: UserRole },
  ): Promise<ProjectWithRelations> {
    const project = await this.projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Projeto de software não encontrado.');
    }
    if (user.role !== 'ADMIN' && project.ownerId !== user.id) {
      throw new ForbiddenException('Você não tem permissão para acessar este projeto.');
    }
    return project;
  }

  toResponse(project: ProjectWithRelations): SoftwareProjectResponse {
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      plainIdea: project.plainIdea,
      targetAudience: project.targetAudience,
      status: project.status as SharedProjectStatus,
      blueprintJson: (project.blueprintJson as unknown as AppBlueprint) || null,
      generatedFilesCount: project.generatedFilesCount,
      lastGeneratedAt: project.lastGeneratedAt
        ? project.lastGeneratedAt.toISOString()
        : null,
      ownerId: project.ownerId,
      templateId: project.templateId,
      aiProviderId: project.aiProviderId,
      owner: project.owner,
      aiProvider: project.aiProvider,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}

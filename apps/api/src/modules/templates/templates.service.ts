import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppTemplate, Prisma } from '@prisma/client';
import {
  AppBlueprint,
  AppTemplateResponse,
  CreateTemplateDto,
  PaginatedResult,
  TemplateCategory,
  TemplateQueryDto,
  UpdateTemplateDto,
  UserRole,
} from '@software-factory/shared';
import { toPaginatedResult } from '../../common/utils/pagination.util';
import { slugify } from '../../common/utils/slugify.util';
import { TemplatesRepository } from './templates.repository';

@Injectable()
export class TemplatesService {
  constructor(private readonly repository: TemplatesRepository) {}

  async list(query: TemplateQueryDto): Promise<PaginatedResult<AppTemplateResponse>> {
    const { items, total } = await this.repository.findManyPaginated(query);
    return toPaginatedResult(
      items.map((item) => this.toResponse(item)),
      total,
      query.page,
      query.pageSize,
    );
  }

  async findOne(id: string): Promise<AppTemplateResponse> {
    const template = await this.repository.findById(id);
    if (!template) {
      throw new NotFoundException('Modelo de aplicativo não encontrado.');
    }
    return this.toResponse(template);
  }

  async create(
    dto: CreateTemplateDto,
    actor: { id: string; role: UserRole },
  ): Promise<AppTemplateResponse> {
    const uniqueSlug = `${slugify(dto.name)}-${Date.now().toString(36).slice(-4)}`;
    const isOfficial = actor.role === 'ADMIN' ? dto.isOfficial : false;

    const created = await this.repository.create({
      name: dto.name,
      slug: uniqueSlug,
      category: dto.category,
      icon: dto.icon,
      shortDescription: dto.shortDescription,
      targetAudience: dto.targetAudience,
      plainPromptExample: dto.plainPromptExample,
      blueprintJson: dto.blueprintJson as unknown as Prisma.InputJsonValue,
      isOfficial,
      authorId: actor.id,
    });
    return this.toResponse(created);
  }

  async update(
    id: string,
    dto: UpdateTemplateDto,
    actor: { id: string; role: UserRole },
  ): Promise<AppTemplateResponse> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Modelo de aplicativo não encontrado.');
    }

    if (actor.role !== 'ADMIN' && existing.authorId !== actor.id) {
      throw new ForbiddenException('Você só pode editar modelos criados por você.');
    }

    const updated = await this.repository.update(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
      ...(dto.shortDescription !== undefined
        ? { shortDescription: dto.shortDescription }
        : {}),
      ...(dto.targetAudience !== undefined ? { targetAudience: dto.targetAudience } : {}),
      ...(dto.plainPromptExample !== undefined
        ? { plainPromptExample: dto.plainPromptExample }
        : {}),
      ...(dto.blueprintJson !== undefined
        ? { blueprintJson: dto.blueprintJson as unknown as Prisma.InputJsonValue }
        : {}),
      ...(dto.isOfficial !== undefined && actor.role === 'ADMIN'
        ? { isOfficial: dto.isOfficial }
        : {}),
    });

    return this.toResponse(updated);
  }

  async remove(
    id: string,
    actor: { id: string; role: UserRole },
  ): Promise<{ deleted: true; id: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Modelo de aplicativo não encontrado.');
    }

    if (actor.role !== 'ADMIN' && existing.authorId !== actor.id) {
      throw new ForbiddenException('Você só pode excluir modelos criados por você.');
    }

    await this.repository.softDelete(id);
    return { deleted: true, id };
  }

  private toResponse(template: AppTemplate): AppTemplateResponse {
    return {
      id: template.id,
      name: template.name,
      slug: template.slug,
      category: template.category as TemplateCategory,
      icon: template.icon,
      shortDescription: template.shortDescription,
      targetAudience: template.targetAudience,
      plainPromptExample: template.plainPromptExample,
      blueprintJson: template.blueprintJson as unknown as AppBlueprint,
      isOfficial: template.isOfficial,
      usageCount: template.usageCount,
      authorId: template.authorId,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}

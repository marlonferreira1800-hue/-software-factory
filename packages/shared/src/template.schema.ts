import { z } from 'zod';
import { PaginationQuerySchema } from './api-response.schema';
import { AppBlueprintSchema } from './blueprint.schema';

export const TemplateCategorySchema = z.enum([
  'SERVICOS',
  'COMERCIO',
  'SAUDE',
  'FINANCAS',
  'EDUCACAO',
  'OPERACOES',
  'OUTROS',
]);
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

export const CreateTemplateSchema = z.object({
  name: z.string().trim().min(3, 'Nome do modelo deve ter pelo menos 3 caracteres.').max(80),
  category: TemplateCategorySchema,
  icon: z.string().trim().min(1).max(40).default('LayoutGrid'),
  shortDescription: z
    .string()
    .trim()
    .min(10, 'Descrição curta deve ter pelo menos 10 caracteres.')
    .max(240),
  targetAudience: z.string().trim().min(3).max(120),
  plainPromptExample: z.string().trim().min(10).max(600),
  blueprintJson: AppBlueprintSchema,
  isOfficial: z.boolean().default(false),
});
export type CreateTemplateDto = z.infer<typeof CreateTemplateSchema>;

export const UpdateTemplateSchema = CreateTemplateSchema.partial();
export type UpdateTemplateDto = z.infer<typeof UpdateTemplateSchema>;

export const TemplateQuerySchema = PaginationQuerySchema.extend({
  category: TemplateCategorySchema.optional(),
  isOfficial: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});
export type TemplateQueryDto = z.infer<typeof TemplateQuerySchema>;

export interface AppTemplateResponse {
  id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  icon: string;
  shortDescription: string;
  targetAudience: string;
  plainPromptExample: string;
  blueprintJson: z.infer<typeof AppBlueprintSchema>;
  isOfficial: boolean;
  usageCount: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

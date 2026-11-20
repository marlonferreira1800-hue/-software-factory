import { z } from 'zod';
import { PaginationQuerySchema } from './api-response.schema';
import { AppBlueprint, AppBlueprintSchema } from './blueprint.schema';

export const ProjectStatusSchema = z.enum(['DRAFT', 'DESIGNED', 'GENERATED', 'EXPORTED']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const CreateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'O nome do projeto deve ter pelo menos 3 caracteres.')
    .max(90),
  plainIdea: z
    .string()
    .trim()
    .min(10, 'Descreva sua ideia com pelo menos 10 caracteres.')
    .max(2000),
  targetAudience: z.string().trim().max(160).optional(),
  templateId: z.string().trim().optional().or(z.literal('')),
  aiProviderId: z.string().trim().optional().or(z.literal('')),
});
export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'O nome do projeto deve ter pelo menos 3 caracteres.')
    .max(90)
    .optional(),
  plainIdea: z
    .string()
    .trim()
    .min(10, 'Descreva sua ideia com pelo menos 10 caracteres.')
    .max(2000)
    .optional(),
  targetAudience: z.string().trim().max(160).optional(),
  status: ProjectStatusSchema.optional(),
  aiProviderId: z.string().trim().nullable().optional(),
  blueprintJson: AppBlueprintSchema.optional(),
});
export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;

export const ProjectQuerySchema = PaginationQuerySchema.extend({
  status: ProjectStatusSchema.optional(),
});
export type ProjectQueryDto = z.infer<typeof ProjectQuerySchema>;

export interface SoftwareProjectResponse {
  id: string;
  name: string;
  slug: string;
  plainIdea: string;
  targetAudience: string | null;
  status: ProjectStatus;
  blueprintJson: AppBlueprint | null;
  generatedFilesCount: number;
  lastGeneratedAt: string | null;
  ownerId: string;
  templateId: string | null;
  aiProviderId: string | null;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  aiProvider?: {
    id: string;
    name: string;
    providerType: string;
    subscriptionBrand: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

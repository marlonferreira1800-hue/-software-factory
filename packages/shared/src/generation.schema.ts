import { z } from 'zod';
import { AppBlueprint } from './blueprint.schema';

export const TargetAiPlatformSchema = z.enum([
  'ANTIGRAVITY',
  'CHATGPT',
  'CLAUDE',
  'GEMINI',
  'GENERIC',
]);
export type TargetAiPlatform = z.infer<typeof TargetAiPlatformSchema>;

export const GenerateBlueprintRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(8, 'Descreva o sistema que deseja construir com pelo menos 8 caracteres.')
    .max(3000),
  providerId: z.string().trim().optional().or(z.literal('')),
});
export type GenerateBlueprintRequestDto = z.infer<typeof GenerateBlueprintRequestSchema>;

export const CreateHandoffPromptSchema = z.object({
  targetPlatform: TargetAiPlatformSchema.default('ANTIGRAVITY'),
  prompt: z
    .string()
    .trim()
    .min(8, 'Descreva o que deseja pedir à sua IA.')
    .max(3000),
});
export type CreateHandoffPromptDto = z.infer<typeof CreateHandoffPromptSchema>;

export const ImportHandoffResponseSchema = z.object({
  rawAiResponse: z
    .string()
    .trim()
    .min(20, 'Cole a resposta completa da sua IA (formato JSON).'),
  targetPlatform: TargetAiPlatformSchema.default('GENERIC'),
});
export type ImportHandoffResponseDto = z.infer<typeof ImportHandoffResponseSchema>;

export const GenerateCodeRequestSchema = z.object({
  includeDocker: z.boolean().default(true),
  includeAiPack: z.boolean().default(true),
});
export type GenerateCodeRequestDto = z.infer<typeof GenerateCodeRequestSchema>;

export interface HandoffPromptPackage {
  targetPlatform: TargetAiPlatform;
  launchUrl: string;
  platformInstructions: string;
  superPrompt: string;
  jobId: string;
}

export interface GeneratedArtifactItem {
  id: string;
  filePath: string;
  layer: 'DATABASE' | 'BACKEND' | 'FRONTEND' | 'INFRA' | 'AI_PACK' | 'DOCS';
  language: string;
  content: string;
  sizeBytes: number;
  createdAt: string;
}

export interface GenerationJobResponse {
  id: string;
  projectId: string;
  providerId: string | null;
  mode: string;
  status: string;
  promptUsed: string;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface ProjectArtifactsBundleResponse {
  projectId: string;
  blueprint: AppBlueprint | null;
  artifacts: GeneratedArtifactItem[];
  jobs: GenerationJobResponse[];
}

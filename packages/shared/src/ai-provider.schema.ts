import { z } from 'zod';
import { PaginationQuerySchema } from './api-response.schema';

export const AiProviderTypeSchema = z.enum([
  'BUILTIN_OFFLINE',
  'SUBSCRIPTION_BRIDGE',
  'ANTIGRAVITY_AGENT',
  'CLAUDE_CLI',
  'GEMINI_CLI',
  'CODEX_CLI',
  'OPENAI_API',
  'ANTHROPIC_API',
  'GEMINI_API',
  'OLLAMA_LOCAL',
  'OPENAI_COMPATIBLE',
]);
export type AiProviderType = z.infer<typeof AiProviderTypeSchema>;

export const AiProviderAuthModeSchema = z.enum([
  'NONE',
  'BROWSER_HANDOFF',
  'LOCAL_CLI',
  'API_KEY',
  'LOCAL_SERVER',
]);
export type AiProviderAuthMode = z.infer<typeof AiProviderAuthModeSchema>;

export const CreateAiProviderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome do conector deve ter pelo menos 2 caracteres.')
    .max(80),
  providerType: AiProviderTypeSchema,
  authMode: AiProviderAuthModeSchema,
  subscriptionBrand: z
    .string()
    .trim()
    .min(2, 'Informe a marca ou plataforma (ex: Antigravity, ChatGPT, Claude, Gemini).')
    .max(60),
  description: z.string().trim().max(300).optional(),
  modelName: z.string().trim().max(100).optional(),
  baseUrl: z
    .string()
    .trim()
    .url('Informe uma URL válida (ex: http://localhost:11434).')
    .optional()
    .or(z.literal('')),
  cliCommand: z.string().trim().max(120).optional(),
  apiKey: z.string().trim().max(300).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type CreateAiProviderDto = z.infer<typeof CreateAiProviderSchema>;

export const UpdateAiProviderSchema = CreateAiProviderSchema.partial();
export type UpdateAiProviderDto = z.infer<typeof UpdateAiProviderSchema>;

export const AiProviderQuerySchema = PaginationQuerySchema.extend({
  providerType: AiProviderTypeSchema.optional(),
  authMode: AiProviderAuthModeSchema.optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});
export type AiProviderQueryDto = z.infer<typeof AiProviderQuerySchema>;

export interface AiProviderResponse {
  id: string;
  name: string;
  slug: string;
  providerType: AiProviderType;
  authMode: AiProviderAuthMode;
  subscriptionBrand: string;
  description: string | null;
  modelName: string | null;
  baseUrl: string | null;
  cliCommand: string | null;
  hasApiKey: boolean;
  maskedApiKey: string | null;
  isDefault: boolean;
  isActive: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiConnectionTestResult {
  success: boolean;
  providerId: string;
  mode: AiProviderAuthMode;
  message: string;
  details?: string;
  testedAt: string;
}

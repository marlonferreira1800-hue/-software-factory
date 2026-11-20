import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AiProviderAuthMode,
  AiProviderQuerySchema,
  AiProviderType,
  CreateAiProviderSchema,
  UpdateAiProviderSchema,
} from '@software-factory/shared';

export { CreateAiProviderSchema, UpdateAiProviderSchema, AiProviderQuerySchema };

export class CreateAiProviderSwaggerDto {
  @ApiProperty({ example: 'Minha Assinatura ChatGPT Plus' })
  name!: string;

  @ApiProperty({
    enum: [
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
    ],
  })
  providerType!: AiProviderType;

  @ApiProperty({
    enum: ['NONE', 'BROWSER_HANDOFF', 'LOCAL_CLI', 'API_KEY', 'LOCAL_SERVER'],
  })
  authMode!: AiProviderAuthMode;

  @ApiProperty({ example: 'ChatGPT' })
  subscriptionBrand!: string;

  @ApiPropertyOptional({ example: 'Ponte guiada sem precisar pagar API extra.' })
  description?: string;

  @ApiPropertyOptional({ example: 'gpt-4o-mini' })
  modelName?: string;

  @ApiPropertyOptional({ example: 'https://chatgpt.com' })
  baseUrl?: string;

  @ApiPropertyOptional({ example: 'codex' })
  cliCommand?: string;

  @ApiPropertyOptional({ example: 'sk-...' })
  apiKey?: string;

  @ApiPropertyOptional({ default: false })
  isDefault?: boolean;

  @ApiPropertyOptional({ default: true })
  isActive?: boolean;
}

export class UpdateAiProviderSwaggerDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  modelName?: string;

  @ApiPropertyOptional()
  baseUrl?: string;

  @ApiPropertyOptional()
  apiKey?: string;

  @ApiPropertyOptional()
  isDefault?: boolean;

  @ApiPropertyOptional()
  isActive?: boolean;
}

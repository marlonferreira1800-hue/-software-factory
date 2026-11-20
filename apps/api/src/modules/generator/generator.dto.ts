import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateHandoffPromptSchema,
  GenerateBlueprintRequestSchema,
  GenerateCodeRequestSchema,
  ImportHandoffResponseSchema,
  TargetAiPlatform,
} from '@software-factory/shared';

export {
  GenerateBlueprintRequestSchema,
  CreateHandoffPromptSchema,
  ImportHandoffResponseSchema,
  GenerateCodeRequestSchema,
};

export class GenerateBlueprintSwaggerDto {
  @ApiProperty({
    example:
      'Quero um sistema de agendamento para barbearia com clientes, serviços, profissionais e horários.',
  })
  prompt!: string;

  @ApiPropertyOptional({ description: 'ID do conector de IA (opcional; padrão usa Motor Offline)' })
  providerId?: string;
}

export class CreateHandoffPromptSwaggerDto {
  @ApiProperty({ enum: ['ANTIGRAVITY', 'CHATGPT', 'CLAUDE', 'GEMINI', 'GENERIC'] })
  targetPlatform!: TargetAiPlatform;

  @ApiProperty({ example: 'Sistema completo de controle de estoque e vendas para pequena loja.' })
  prompt!: string;
}

export class ImportHandoffSwaggerDto {
  @ApiProperty({ description: 'Resposta JSON copiada da sua assinatura de IA' })
  rawAiResponse!: string;

  @ApiPropertyOptional({ enum: ['ANTIGRAVITY', 'CHATGPT', 'CLAUDE', 'GEMINI', 'GENERIC'] })
  targetPlatform?: TargetAiPlatform;
}

export class GenerateCodeSwaggerDto {
  @ApiPropertyOptional({ default: true })
  includeDocker?: boolean;

  @ApiPropertyOptional({ default: true })
  includeAiPack?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AppBlueprint,
  CreateTemplateSchema,
  TemplateCategory,
  TemplateQuerySchema,
  UpdateTemplateSchema,
} from '@software-factory/shared';

export { CreateTemplateSchema, UpdateTemplateSchema, TemplateQuerySchema };

export class CreateTemplateSwaggerDto {
  @ApiProperty({ example: 'Agenda Fácil para Barbearia' })
  name!: string;

  @ApiProperty({
    enum: ['SERVICOS', 'COMERCIO', 'SAUDE', 'FINANCAS', 'EDUCACAO', 'OPERACOES', 'OUTROS'],
  })
  category!: TemplateCategory;

  @ApiPropertyOptional({ example: 'Scissors' })
  icon?: string;

  @ApiProperty({ example: 'Controle completo de clientes, cortes, barbeiros e horários.' })
  shortDescription!: string;

  @ApiProperty({ example: 'Barbearias, salões de beleza e clínicas de estética' })
  targetAudience!: string;

  @ApiProperty({
    example: 'Quero um sistema de barbearia com cadastro de clientes, serviços, barbeiros e agendamentos.',
  })
  plainPromptExample!: string;

  @ApiProperty({ type: Object })
  blueprintJson!: AppBlueprint;

  @ApiPropertyOptional({ default: false })
  isOfficial?: boolean;
}

export class UpdateTemplateSwaggerDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({
    enum: ['SERVICOS', 'COMERCIO', 'SAUDE', 'FINANCAS', 'EDUCACAO', 'OPERACOES', 'OUTROS'],
  })
  category?: TemplateCategory;

  @ApiPropertyOptional()
  icon?: string;

  @ApiPropertyOptional()
  shortDescription?: string;

  @ApiPropertyOptional()
  targetAudience?: string;

  @ApiPropertyOptional()
  plainPromptExample?: string;

  @ApiPropertyOptional({ type: Object })
  blueprintJson?: AppBlueprint;

  @ApiPropertyOptional()
  isOfficial?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AppBlueprint,
  CreateProjectSchema,
  ProjectQuerySchema,
  ProjectStatus,
  UpdateProjectSchema,
} from '@software-factory/shared';

export { CreateProjectSchema, UpdateProjectSchema, ProjectQuerySchema };

export class CreateProjectSwaggerDto {
  @ApiProperty({ example: 'Agenda da Barbearia Central' })
  name!: string;

  @ApiProperty({
    example:
      'Quero controlar meus clientes, cortes disponíveis, barbeiros e horários marcados pelo WhatsApp.',
  })
  plainIdea!: string;

  @ApiPropertyOptional({ example: 'Barbearias e salões locais' })
  targetAudience?: string;

  @ApiPropertyOptional({ description: 'ID opcional de modelo pronto para clonar' })
  templateId?: string;

  @ApiPropertyOptional({ description: 'ID opcional do conector de IA preferido' })
  aiProviderId?: string;
}

export class UpdateProjectSwaggerDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  plainIdea?: string;

  @ApiPropertyOptional()
  targetAudience?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'DESIGNED', 'GENERATED', 'EXPORTED'] })
  status?: ProjectStatus;

  @ApiPropertyOptional()
  aiProviderId?: string | null;

  @ApiPropertyOptional({ type: Object })
  blueprintJson?: AppBlueprint;
}

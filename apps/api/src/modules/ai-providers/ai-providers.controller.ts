import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AiProviderQueryDto,
  CreateAiProviderDto,
  UpdateAiProviderDto,
} from '@software-factory/shared';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AiProviderQuerySchema,
  CreateAiProviderSchema,
  CreateAiProviderSwaggerDto,
  UpdateAiProviderSchema,
  UpdateAiProviderSwaggerDto,
} from './ai-providers.dto';
import { AiProvidersService } from './ai-providers.service';

@ApiTags('Conectores de IA & Assinaturas')
@ApiBearerAuth()
@Controller('ai-providers')
export class AiProvidersController {
  constructor(private readonly aiProvidersService: AiProvidersService) {}

  @Get()
  @Roles('ADMIN', 'BUILDER', 'VIEWER')
  @ApiOperation({ summary: 'Listar conectores de IA configurados com paginação e filtros' })
  list(
    @Query(new ZodValidationPipe(AiProviderQuerySchema)) query: AiProviderQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiProvidersService.list(query, user);
  }

  @Get(':id')
  @Roles('ADMIN', 'BUILDER', 'VIEWER')
  @ApiOperation({ summary: 'Consultar detalhes de um conector de IA' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.aiProvidersService.findOne(id, user);
  }

  @Post()
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({ summary: 'Cadastrar novo conector (Assinatura Web, CLI local, Ollama ou API)' })
  @ApiBody({ type: CreateAiProviderSwaggerDto })
  create(
    @Body(new ZodValidationPipe(CreateAiProviderSchema)) dto: CreateAiProviderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiProvidersService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({ summary: 'Atualizar conector de IA' })
  @ApiBody({ type: UpdateAiProviderSwaggerDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAiProviderSchema)) dto: UpdateAiProviderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aiProvidersService.update(id, dto, user);
  }

  @Post(':id/test')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({ summary: 'Testar disponibilidade e conexão do conector de IA' })
  testConnection(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.aiProvidersService.testConnection(id, user);
  }

  @Delete(':id')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({ summary: 'Remover conector de IA (soft delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.aiProvidersService.remove(id, user);
  }
}

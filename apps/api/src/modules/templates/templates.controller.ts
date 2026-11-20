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
  CreateTemplateDto,
  TemplateQueryDto,
  UpdateTemplateDto,
} from '@software-factory/shared';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateTemplateSchema,
  CreateTemplateSwaggerDto,
  TemplateQuerySchema,
  UpdateTemplateSchema,
  UpdateTemplateSwaggerDto,
} from './templates.dto';
import { TemplatesService } from './templates.service';

@ApiTags('Modelos Prontos (Templates)')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @Roles('ADMIN', 'BUILDER', 'VIEWER')
  @ApiOperation({ summary: 'Listar modelos prontos com paginação, busca e categoria' })
  list(@Query(new ZodValidationPipe(TemplateQuerySchema)) query: TemplateQueryDto) {
    return this.templatesService.list(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'BUILDER', 'VIEWER')
  @ApiOperation({ summary: 'Obter detalhes de um modelo pronto' })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({ summary: 'Cadastrar novo modelo reutilizável' })
  @ApiBody({ type: CreateTemplateSwaggerDto })
  create(
    @Body(new ZodValidationPipe(CreateTemplateSchema)) dto: CreateTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templatesService.create(dto, user);
  }

  @Patch(':id')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({ summary: 'Atualizar modelo existente' })
  @ApiBody({ type: UpdateTemplateSwaggerDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTemplateSchema)) dto: UpdateTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templatesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({ summary: 'Remover modelo logicamente (soft delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.remove(id, user);
  }
}

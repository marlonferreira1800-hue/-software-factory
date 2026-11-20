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
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from '@software-factory/shared';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateProjectSchema,
  CreateProjectSwaggerDto,
  ProjectQuerySchema,
  UpdateProjectSchema,
  UpdateProjectSwaggerDto,
} from './projects.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projetos de Software')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Roles('ADMIN', 'BUILDER', 'VIEWER')
  @ApiOperation({ summary: 'Listar projetos com paginação, busca e filtro por status' })
  list(
    @Query(new ZodValidationPipe(ProjectQuerySchema)) query: ProjectQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.list(query, user);
  }

  @Get(':id')
  @Roles('ADMIN', 'BUILDER', 'VIEWER')
  @ApiOperation({ summary: 'Buscar detalhes e blueprint do projeto' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findOne(id, user);
  }

  @Post()
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({ summary: 'Criar novo projeto de software (do zero ou via template)' })
  @ApiBody({ type: CreateProjectSwaggerDto })
  create(
    @Body(new ZodValidationPipe(CreateProjectSchema)) dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({ summary: 'Atualizar nome, ideia, conector IA ou blueprint do projeto' })
  @ApiBody({ type: UpdateProjectSwaggerDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProjectSchema)) dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('ADMIN', 'BUILDER')
  @ApiOperation({ summary: 'Excluir projeto logicamente (soft delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.remove(id, user);
  }
}

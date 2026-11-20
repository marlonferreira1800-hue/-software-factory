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
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '@software-factory/shared';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateUserSchema,
  CreateUserSwaggerDto,
  UpdateUserSchema,
  UpdateUserSwaggerDto,
  UserQuerySchema,
} from './users.dto';
import { UsersService } from './users.service';

@ApiTags('Usuários (RBAC Admin)')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuários com paginação, busca e filtros (ADMIN)' })
  list(@Query(new ZodValidationPipe(UserQuerySchema)) query: UserQueryDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID (ADMIN)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar usuário manualmente com papel RBAC (ADMIN)' })
  @ApiBody({ type: CreateUserSwaggerDto })
  create(@Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados ou papel RBAC do usuário (ADMIN)' })
  @ApiBody({ type: UpdateUserSwaggerDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, actor.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuário logicamente (soft delete) (ADMIN)' })
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.remove(id, actor.id);
  }
}

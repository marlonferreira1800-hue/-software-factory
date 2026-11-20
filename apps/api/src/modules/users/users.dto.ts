import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserQuerySchema,
  UserRole,
} from '@software-factory/shared';

export { CreateUserSchema, UpdateUserSchema, UserQuerySchema };

export class CreateUserSwaggerDto {
  @ApiProperty({ example: 'João Santos' })
  name!: string;

  @ApiProperty({ example: 'joao@empresa.com' })
  email!: string;

  @ApiProperty({ example: 'Senha@123', minLength: 6 })
  password!: string;

  @ApiProperty({ enum: ['ADMIN', 'BUILDER', 'VIEWER'], default: 'BUILDER' })
  role!: UserRole;

  @ApiPropertyOptional({ default: true })
  isActive?: boolean;
}

export class UpdateUserSwaggerDto {
  @ApiPropertyOptional({ example: 'João Santos' })
  name?: string;

  @ApiPropertyOptional({ example: 'joao@empresa.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'NovaSenha@123' })
  password?: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'BUILDER', 'VIEWER'] })
  role?: UserRole;

  @ApiPropertyOptional()
  isActive?: boolean;
}

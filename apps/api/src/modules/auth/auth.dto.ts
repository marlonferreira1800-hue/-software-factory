import { ApiProperty } from '@nestjs/swagger';
import { LoginSchema, RegisterSchema } from '@software-factory/shared';

export { LoginSchema, RegisterSchema };

export class RegisterSwaggerDto {
  @ApiProperty({ example: 'Maria Oliveira', minLength: 2 })
  name!: string;

  @ApiProperty({ example: 'maria@exemplo.com' })
  email!: string;

  @ApiProperty({ example: 'SenhaSegura123', minLength: 6 })
  password!: string;
}

export class LoginSwaggerDto {
  @ApiProperty({ example: 'criador@fabricalivre.org' })
  email!: string;

  @ApiProperty({ example: 'Criador@123' })
  password!: string;
}

import { AppBlueprint, BlueprintEntity, EntityField } from '@software-factory/shared';

export interface GeneratedCodeFile {
  filePath: string;
  layer: 'DATABASE' | 'BACKEND' | 'FRONTEND' | 'INFRA' | 'AI_PACK' | 'DOCS';
  language: string;
  content: string;
}

export function generateNestJsBackend(blueprint: AppBlueprint): GeneratedCodeFile[] {
  const files: GeneratedCodeFile[] = [];

  files.push({
    filePath: 'backend/package.json',
    layer: 'BACKEND',
    language: 'json',
    content: JSON.stringify(
      {
        name: `${blueprint.slug}-api`,
        version: '1.0.0',
        private: true,
        scripts: {
          build: 'nest build',
          dev: 'nest start --watch',
          start: 'node dist/main',
          'prisma:generate': 'prisma generate',
          'prisma:migrate': 'prisma migrate dev',
        },
        dependencies: {
          '@nestjs/common': '^11.0.0',
          '@nestjs/core': '^11.0.0',
          '@nestjs/jwt': '^11.0.0',
          '@nestjs/passport': '^11.0.0',
          '@nestjs/platform-express': '^11.0.0',
          '@nestjs/swagger': '^11.0.0',
          '@prisma/client': '^6.19.0',
          passport: '^0.7.0',
          'passport-jwt': '^4.0.1',
          'reflect-metadata': '^0.2.2',
          rxjs: '^7.8.2',
          zod: '^3.25.0',
        },
        devDependencies: {
          '@nestjs/cli': '^11.0.0',
          '@types/node': '^22.0.0',
          prisma: '^6.19.0',
          typescript: '^5.8.0',
        },
      },
      null,
      2,
    ),
  });

  files.push({
    filePath: 'backend/src/prisma/prisma.service.ts',
    layer: 'BACKEND',
    language: 'typescript',
    content: [
      `import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';`,
      `import { PrismaClient } from '@prisma/client';`,
      ``,
      `@Injectable()`,
      `export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {`,
      `  async onModuleInit(): Promise<void> {`,
      `    await this.$connect();`,
      `  }`,
      ``,
      `  async onModuleDestroy(): Promise<void> {`,
      `    await this.$disconnect();`,
      `  }`,
      `}`,
      ``,
    ].join('\n'),
  });

  files.push({
    filePath: 'backend/src/common/zod-validation.pipe.ts',
    layer: 'BACKEND',
    language: 'typescript',
    content: [
      `import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';`,
      `import { ZodSchema } from 'zod';`,
      ``,
      `@Injectable()`,
      `export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {`,
      `  constructor(private readonly schema: ZodSchema<T>) {}`,
      ``,
      `  transform(value: unknown): T {`,
      `    const parsed = this.schema.safeParse(value);`,
      `    if (!parsed.success) {`,
      `      throw new BadRequestException({`,
      `        message: 'Dados inválidos enviados na requisição.',`,
      `        details: parsed.error.errors.map((e) => \`\${e.path.join('.')}: \${e.message}\`),`,
      `      });`,
      `    }`,
      `    return parsed.data;`,
      `  }`,
      `}`,
      ``,
    ].join('\n'),
  });

  files.push({
    filePath: 'backend/src/common/rbac.guard.ts',
    layer: 'BACKEND',
    language: 'typescript',
    content: [
      `import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';`,
      `import { Reflector } from '@nestjs/core';`,
      `import { AuthGuard } from '@nestjs/passport';`,
      ``,
      `export const ROLES_KEY = 'roles';`,
      `export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);`,
      ``,
      `@Injectable()`,
      `export class JwtAuthGuard extends AuthGuard('jwt') {}`,
      ``,
      `@Injectable()`,
      `export class RolesGuard implements CanActivate {`,
      `  constructor(private readonly reflector: Reflector) {}`,
      ``,
      `  canActivate(context: ExecutionContext): boolean {`,
      `    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [`,
      `      context.getHandler(),`,
      `      context.getClass(),`,
      `    ]);`,
      `    if (!required || required.length === 0) return true;`,
      `    const req = context.switchToHttp().getRequest<{ user?: { role: string } }>();`,
      `    if (!req.user || !required.includes(req.user.role)) {`,
      `      throw new ForbiddenException('Sem permissão para executar esta operação.');`,
      `    }`,
      `    return true;`,
      `  }`,
      `}`,
      ``,
    ].join('\n'),
  });

  const moduleImports: string[] = [];
  const moduleNames: string[] = [];

  for (const entity of blueprint.entities) {
    const className = entity.name;
    const slug = entity.slug;
    moduleImports.push(`import { ${className}Module } from './modules/${slug}/${slug}.module';`);
    moduleNames.push(`${className}Module`);

    files.push(renderDtoFile(entity));
    files.push(renderRepositoryFile(entity));
    files.push(renderServiceFile(entity));
    files.push(renderControllerFile(entity));
    files.push(renderModuleFile(entity));
  }

  files.push({
    filePath: 'backend/src/app.module.ts',
    layer: 'BACKEND',
    language: 'typescript',
    content: [
      `import { Module } from '@nestjs/common';`,
      `import { PrismaService } from './prisma/prisma.service';`,
      ...moduleImports,
      ``,
      `@Module({`,
      `  imports: [${moduleNames.join(', ')}],`,
      `  providers: [PrismaService],`,
      `})`,
      `export class AppModule {}`,
      ``,
    ].join('\n'),
  });

  files.push({
    filePath: 'backend/src/main.ts',
    layer: 'BACKEND',
    language: 'typescript',
    content: [
      `import { NestFactory } from '@nestjs/core';`,
      `import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';`,
      `import { AppModule } from './app.module';`,
      ``,
      `async function bootstrap(): Promise<void> {`,
      `  const app = await NestFactory.create(AppModule);`,
      `  app.enableCors({ origin: process.env.CORS_ORIGIN || '*' });`,
      `  app.setGlobalPrefix('api');`,
      ``,
      `  const config = new DocumentBuilder()`,
      `    .setTitle('${blueprint.appName.replace(/'/g, "\\'")}')`,
      `    .setDescription('${blueprint.tagline.replace(/'/g, "\\'")}')`,
      `    .setVersion('1.0.0')`,
      `    .addBearerAuth()`,
      `    .build();`,
      `  const document = SwaggerModule.createDocument(app, config);`,
      `  SwaggerModule.setup('api/docs', app, document);`,
      ``,
      `  await app.listen(Number(process.env.PORT || 3001));`,
      `}`,
      `bootstrap();`,
      ``,
    ].join('\n'),
  });

  return files;
}

function renderZodField(field: EntityField): string {
  let base = 'z.string().trim()';
  switch (field.type) {
    case 'int':
      base = 'z.coerce.number().int()';
      break;
    case 'decimal':
    case 'currency':
      base = 'z.coerce.number().min(0)';
      break;
    case 'boolean':
      base = 'z.boolean()';
      break;
    case 'email':
      base = 'z.string().trim().email("E-mail inválido")';
      break;
    case 'date':
    case 'datetime':
      base = 'z.coerce.date()';
      break;
    case 'enum':
      if (field.enumValues && field.enumValues.length > 0) {
        const quoted = field.enumValues.map((v) => `'${v}'`).join(', ');
        base = `z.enum([${quoted}])`;
      }
      break;
    default:
      base = field.required
        ? `z.string().trim().min(1, "Informe ${field.label}")`
        : 'z.string().trim()';
      break;
  }

  return field.required ? base : `${base}.optional()`;
}

function renderDtoFile(entity: BlueprintEntity): GeneratedCodeFile {
  const fieldsCode = entity.fields
    .map((f) => `  ${f.name}: ${renderZodField(f)},`)
    .join('\n');

  return {
    filePath: `backend/src/modules/${entity.slug}/${entity.slug}.dto.ts`,
    layer: 'BACKEND',
    language: 'typescript',
    content: [
      `import { z } from 'zod';`,
      ``,
      `export const Create${entity.name}Schema = z.object({`,
      fieldsCode,
      `});`,
      `export type Create${entity.name}Dto = z.infer<typeof Create${entity.name}Schema>;`,
      ``,
      `export const Update${entity.name}Schema = Create${entity.name}Schema.partial();`,
      `export type Update${entity.name}Dto = z.infer<typeof Update${entity.name}Schema>;`,
      ``,
      `export const ${entity.name}QuerySchema = z.object({`,
      `  page: z.coerce.number().int().min(1).default(1),`,
      `  pageSize: z.coerce.number().int().min(1).max(100).default(10),`,
      `  search: z.string().trim().optional(),`,
      `});`,
      `export type ${entity.name}QueryDto = z.infer<typeof ${entity.name}QuerySchema>;`,
      ``,
    ].join('\n'),
  };
}

function renderRepositoryFile(entity: BlueprintEntity): GeneratedCodeFile {
  const modelProp = entity.name.charAt(0).toLowerCase() + entity.name.slice(1);
  const searchableFields = entity.fields.filter(
    (f) => f.searchable && ['string', 'text', 'email', 'phone'].includes(f.type),
  );
  const searchOr =
    searchableFields.length > 0
      ? searchableFields
          .map((f) => `{ ${f.name}: { contains: query.search, mode: 'insensitive' as const } }`)
          .join(', ')
      : '';

  return {
    filePath: `backend/src/modules/${entity.slug}/${entity.slug}.repository.ts`,
    layer: 'BACKEND',
    language: 'typescript',
    content: [
      `import { Injectable } from '@nestjs/common';`,
      `import { PrismaService } from '../../prisma/prisma.service';`,
      `import { Create${entity.name}Dto, ${entity.name}QueryDto, Update${entity.name}Dto } from './${entity.slug}.dto';`,
      ``,
      `@Injectable()`,
      `export class ${entity.name}Repository {`,
      `  constructor(private readonly prisma: PrismaService) {}`,
      ``,
      `  async findPaginated(query: ${entity.name}QueryDto) {`,
      `    const where = {`,
      entity.softDelete ? `      deletedAt: null,` : ``,
      searchOr
        ? `      ...(query.search ? { OR: [${searchOr}] } : {}),`
        : ``,
      `    };`,
      `    const [data, total] = await Promise.all([`,
      `      this.prisma.${modelProp}.findMany({`,
      `        where,`,
      `        orderBy: { createdAt: 'desc' },`,
      `        skip: (query.page - 1) * query.pageSize,`,
      `        take: query.pageSize,`,
      `      }),`,
      `      this.prisma.${modelProp}.count({ where }),`,
      `    ]);`,
      `    return { data, total };`,
      `  }`,
      ``,
      `  async findById(id: string) {`,
      `    return this.prisma.${modelProp}.findFirst({`,
      `      where: { id${entity.softDelete ? ', deletedAt: null' : ''} },`,
      `    });`,
      `  }`,
      ``,
      `  async create(dto: Create${entity.name}Dto) {`,
      `    return this.prisma.${modelProp}.create({ data: dto });`,
      `  }`,
      ``,
      `  async update(id: string, dto: Update${entity.name}Dto) {`,
      `    return this.prisma.${modelProp}.update({ where: { id }, data: dto });`,
      `  }`,
      ``,
      `  async remove(id: string) {`,
      entity.softDelete
        ? `    return this.prisma.${modelProp}.update({ where: { id }, data: { deletedAt: new Date() } });`
        : `    return this.prisma.${modelProp}.delete({ where: { id } });`,
      `  }`,
      `}`,
      ``,
    ]
      .filter((line) => line !== undefined)
      .join('\n'),
  };
}

function renderServiceFile(entity: BlueprintEntity): GeneratedCodeFile {
  return {
    filePath: `backend/src/modules/${entity.slug}/${entity.slug}.service.ts`,
    layer: 'BACKEND',
    language: 'typescript',
    content: [
      `import { Injectable, NotFoundException } from '@nestjs/common';`,
      `import { Create${entity.name}Dto, ${entity.name}QueryDto, Update${entity.name}Dto } from './${entity.slug}.dto';`,
      `import { ${entity.name}Repository } from './${entity.slug}.repository';`,
      ``,
      `@Injectable()`,
      `export class ${entity.name}Service {`,
      `  constructor(private readonly repository: ${entity.name}Repository) {}`,
      ``,
      `  async list(query: ${entity.name}QueryDto) {`,
      `    const { data, total } = await this.repository.findPaginated(query);`,
      `    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));`,
      `    return {`,
      `      data,`,
      `      meta: { page: query.page, pageSize: query.pageSize, total, totalPages },`,
      `    };`,
      `  }`,
      ``,
      `  async findOne(id: string) {`,
      `    const record = await this.repository.findById(id);`,
      `    if (!record) {`,
      `      throw new NotFoundException('${entity.label} não encontrado.');`,
      `    }`,
      `    return record;`,
      `  }`,
      ``,
      `  async create(dto: Create${entity.name}Dto) {`,
      `    return this.repository.create(dto);`,
      `  }`,
      ``,
      `  async update(id: string, dto: Update${entity.name}Dto) {`,
      `    await this.findOne(id);`,
      `    return this.repository.update(id, dto);`,
      `  }`,
      ``,
      `  async remove(id: string) {`,
      `    await this.findOne(id);`,
      `    await this.repository.remove(id);`,
      `    return { deleted: true, id };`,
      `  }`,
      `}`,
      ``,
    ].join('\n'),
  };
}

function renderControllerFile(entity: BlueprintEntity): GeneratedCodeFile {
  const readRoles = entity.readRoles.map((r) => `'${r}'`).join(', ');
  const writeRoles = entity.writeRoles.map((r) => `'${r}'`).join(', ');

  return {
    filePath: `backend/src/modules/${entity.slug}/${entity.slug}.controller.ts`,
    layer: 'BACKEND',
    language: 'typescript',
    content: [
      `import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';`,
      `import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';`,
      `import { JwtAuthGuard, Roles, RolesGuard } from '../../common/rbac.guard';`,
      `import { ZodValidationPipe } from '../../common/zod-validation.pipe';`,
      `import {`,
      `  Create${entity.name}Dto,`,
      `  Create${entity.name}Schema,`,
      `  ${entity.name}QueryDto,`,
      `  ${entity.name}QuerySchema,`,
      `  Update${entity.name}Dto,`,
      `  Update${entity.name}Schema,`,
      `} from './${entity.slug}.dto';`,
      `import { ${entity.name}Service } from './${entity.slug}.service';`,
      ``,
      `@ApiTags('${entity.pluralLabel}')`,
      `@ApiBearerAuth()`,
      `@UseGuards(JwtAuthGuard, RolesGuard)`,
      `@Controller('${entity.slug}')`,
      `export class ${entity.name}Controller {`,
      `  constructor(private readonly service: ${entity.name}Service) {}`,
      ``,
      `  @Get()`,
      `  @Roles(${readRoles})`,
      `  @ApiOperation({ summary: 'Listar ${entity.pluralLabel} com paginação e busca' })`,
      `  list(@Query(new ZodValidationPipe(${entity.name}QuerySchema)) query: ${entity.name}QueryDto) {`,
      `    return this.service.list(query);`,
      `  }`,
      ``,
      `  @Get(':id')`,
      `  @Roles(${readRoles})`,
      `  @ApiOperation({ summary: 'Buscar ${entity.label} por ID' })`,
      `  findOne(@Param('id') id: string) {`,
      `    return this.service.findOne(id);`,
      `  }`,
      ``,
      `  @Post()`,
      `  @Roles(${writeRoles})`,
      `  @ApiOperation({ summary: 'Criar ${entity.label}' })`,
      `  create(@Body(new ZodValidationPipe(Create${entity.name}Schema)) dto: Create${entity.name}Dto) {`,
      `    return this.service.create(dto);`,
      `  }`,
      ``,
      `  @Patch(':id')`,
      `  @Roles(${writeRoles})`,
      `  @ApiOperation({ summary: 'Atualizar ${entity.label}' })`,
      `  update(`,
      `    @Param('id') id: string,`,
      `    @Body(new ZodValidationPipe(Update${entity.name}Schema)) dto: Update${entity.name}Dto,`,
      `  ) {`,
      `    return this.service.update(id, dto);`,
      `  }`,
      ``,
      `  @Delete(':id')`,
      `  @Roles('ADMIN', 'BUILDER')`,
      `  @ApiOperation({ summary: 'Excluir ${entity.label}' })`,
      `  remove(@Param('id') id: string) {`,
      `    return this.service.remove(id);`,
      `  }`,
      `}`,
      ``,
    ].join('\n'),
  };
}

function renderModuleFile(entity: BlueprintEntity): GeneratedCodeFile {
  return {
    filePath: `backend/src/modules/${entity.slug}/${entity.slug}.module.ts`,
    layer: 'BACKEND',
    language: 'typescript',
    content: [
      `import { Module } from '@nestjs/common';`,
      `import { PrismaService } from '../../prisma/prisma.service';`,
      `import { ${entity.name}Controller } from './${entity.slug}.controller';`,
      `import { ${entity.name}Repository } from './${entity.slug}.repository';`,
      `import { ${entity.name}Service } from './${entity.slug}.service';`,
      ``,
      `@Module({`,
      `  controllers: [${entity.name}Controller],`,
      `  providers: [${entity.name}Service, ${entity.name}Repository, PrismaService],`,
      `})`,
      `export class ${entity.name}Module {}`,
      ``,
    ].join('\n'),
  };
}

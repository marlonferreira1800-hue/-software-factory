import { AppBlueprint, BlueprintEntity, EntityField } from '@software-factory/shared';

export function generatePrismaSchema(blueprint: AppBlueprint): string {
  const enumBlocks: string[] = [];
  const modelBlocks: string[] = [];

  for (const entity of blueprint.entities) {
    for (const field of entity.fields) {
      if (field.type === 'enum' && field.enumValues && field.enumValues.length > 0) {
        const enumName = `${entity.name}${capitalize(field.name)}`;
        const values = field.enumValues
          .map((v) => `  ${v.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`)
          .join('\n');
        enumBlocks.push(`enum ${enumName} {\n${values}\n}`);
      }
    }

    modelBlocks.push(renderEntityModel(entity));
  }

  return [
    `generator client {`,
    `  provider = "prisma-client-js"`,
    `}`,
    ``,
    `datasource db {`,
    `  provider = "postgresql"`,
    `  url      = env("DATABASE_URL")`,
    `}`,
    ``,
    `enum Role {`,
    `  ADMIN`,
    `  BUILDER`,
    `  VIEWER`,
    `}`,
    ``,
    ...enumBlocks.flatMap((block) => [block, '']),
    `model User {`,
    `  id           String    @id @default(cuid())`,
    `  name         String`,
    `  email        String    @unique`,
    `  passwordHash String`,
    `  role         Role      @default(BUILDER)`,
    `  isActive     Boolean   @default(true)`,
    `  createdAt    DateTime  @default(now())`,
    `  updatedAt    DateTime  @updatedAt`,
    `  deletedAt    DateTime?`,
    ``,
    `  @@index([deletedAt])`,
    `  @@map("users")`,
    `}`,
    ``,
    ...modelBlocks.flatMap((block) => [block, '']),
  ].join('\n');
}

function renderEntityModel(entity: BlueprintEntity): string {
  const lines: string[] = [
    `model ${entity.name} {`,
    `  id        String    @id @default(cuid())`,
  ];

  for (const field of entity.fields) {
    lines.push(`  ${renderPrismaField(entity, field)}`);
  }

  lines.push(`  createdAt DateTime  @default(now())`);
  lines.push(`  updatedAt DateTime  @updatedAt`);
  if (entity.softDelete) {
    lines.push(`  deletedAt DateTime?`);
    lines.push('');
    lines.push(`  @@index([deletedAt])`);
  }
  lines.push(`  @@map("${entity.slug.replace(/-/g, '_')}")`);
  lines.push(`}`);

  return lines.join('\n');
}

function renderPrismaField(entity: BlueprintEntity, field: EntityField): string {
  const nullable = field.required ? '' : '?';
  const unique = field.unique ? ' @unique' : '';
  let prismaType = 'String';

  switch (field.type) {
    case 'int':
      prismaType = 'Int';
      break;
    case 'decimal':
    case 'currency':
      prismaType = 'Decimal @db.Decimal(12, 2)';
      break;
    case 'boolean':
      prismaType = 'Boolean @default(true)';
      break;
    case 'date':
    case 'datetime':
      prismaType = 'DateTime';
      break;
    case 'enum':
      if (field.enumValues && field.enumValues.length > 0) {
        prismaType = `${entity.name}${capitalize(field.name)}`;
      } else {
        prismaType = 'String';
      }
      break;
    default:
      prismaType = 'String';
      break;
  }

  if (field.type === 'boolean') {
    return `${field.name} Boolean${nullable} @default(true)${unique}`;
  }
  if (field.type === 'decimal' || field.type === 'currency') {
    return `${field.name} Decimal${nullable} @db.Decimal(12, 2)${unique}`;
  }

  return `${field.name} ${prismaType}${nullable}${unique}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

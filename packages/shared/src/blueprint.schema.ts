import { z } from 'zod';

export const FieldTypeSchema = z.enum([
  'string',
  'text',
  'int',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'email',
  'phone',
  'currency',
  'enum',
  'relation',
]);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export const EntityFieldSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome técnico do campo é obrigatório.')
    .regex(/^[a-z][a-zA-Z0-9]*$/, 'Use camelCase iniciando com letra minúscula (ex: nomeCliente).'),
  label: z
    .string()
    .trim()
    .min(1, 'Rótulo amigável do campo é obrigatório.')
    .max(60),
  type: FieldTypeSchema,
  required: z.boolean().default(true),
  unique: z.boolean().default(false),
  searchable: z.boolean().default(true),
  showInTable: z.boolean().default(true),
  enumValues: z.array(z.string().trim().min(1)).optional(),
  relationTarget: z.string().trim().optional(),
  placeholder: z.string().trim().max(120).optional(),
  helpText: z.string().trim().max(200).optional(),
});
export type EntityField = z.infer<typeof EntityFieldSchema>;

export const BlueprintEntitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome da entidade deve ter ao menos 2 caracteres.')
    .regex(/^[A-Z][a-zA-Z0-9]*$/, 'Nome da entidade deve estar em PascalCase (ex: Cliente).'),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z][a-z0-9-]*$/, 'Slug deve conter apenas letras minúsculas, números e hífens.'),
  label: z.string().trim().min(2).max(50),
  pluralLabel: z.string().trim().min(2).max(60),
  description: z.string().trim().min(2).max(300),
  icon: z.string().trim().min(1).max(40).default('FolderKanban'),
  softDelete: z.boolean().default(true),
  readRoles: z.array(z.enum(['ADMIN', 'BUILDER', 'VIEWER'])).default(['ADMIN', 'BUILDER', 'VIEWER']),
  writeRoles: z.array(z.enum(['ADMIN', 'BUILDER', 'VIEWER'])).default(['ADMIN', 'BUILDER']),
  fields: z
    .array(EntityFieldSchema)
    .min(1, 'Cada módulo do sistema precisa de pelo menos 1 campo.'),
});
export type BlueprintEntity = z.infer<typeof BlueprintEntitySchema>;

export const BlueprintWorkflowSchema = z.object({
  name: z.string().trim().min(2).max(80),
  trigger: z.string().trim().min(2).max(160),
  action: z.string().trim().min(2).max(200),
});
export type BlueprintWorkflow = z.infer<typeof BlueprintWorkflowSchema>;

export const AppBlueprintSchema = z.object({
  appName: z.string().trim().min(2, 'Informe o nome do aplicativo.').max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z][a-z0-9-]*$/, 'Slug inválido.'),
  tagline: z.string().trim().min(4).max(160),
  summary: z.string().trim().min(10).max(800),
  targetAudience: z.string().trim().min(2).max(160).default('Pequenos negócios e equipes'),
  primaryColor: z.string().trim().default('#1B4332'),
  roles: z
    .array(
      z.object({
        key: z.string().trim().min(2).max(30),
        label: z.string().trim().min(2).max(50),
        description: z.string().trim().min(2).max(200),
      }),
    )
    .min(1)
    .default([
      {
        key: 'ADMIN',
        label: 'Administrador',
        description: 'Acesso completo a cadastros, configurações e exclusões.',
      },
      {
        key: 'OPERATOR',
        label: 'Operador',
        description: 'Pode cadastrar, editar e consultar dados no dia a dia.',
      },
    ]),
  entities: z
    .array(BlueprintEntitySchema)
    .min(1, 'O projeto precisa ter pelo menos 1 tela/tabela.')
    .max(15, 'Máximo de 15 módulos por projeto.'),
  workflows: z.array(BlueprintWorkflowSchema).default([]),
});
export type AppBlueprint = z.infer<typeof AppBlueprintSchema>;

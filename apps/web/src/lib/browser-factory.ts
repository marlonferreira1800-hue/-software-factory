import JSZip from 'jszip';
import {
  AiProviderResponse,
  AppBlueprint,
  AppBlueprintSchema,
  AppTemplateResponse,
  BlueprintEntity,
  GeneratedArtifactItem,
  HandoffPromptPackage,
  PaginatedResult,
  ProjectArtifactsBundleResponse,
  ProjectStatus,
  SoftwareProjectResponse,
  TargetAiPlatform,
  UserResponse,
} from '@software-factory/shared';

const STORAGE_KEY = 'fabrica_livre_browser_db_v1';

interface BrowserDb {
  users: UserResponse[];
  currentUserId: string;
  providers: AiProviderResponse[];
  templates: AppTemplateResponse[];
  projects: SoftwareProjectResponse[];
  artifactsByProject: Record<string, GeneratedArtifactItem[]>;
  jobsByProject: Record<
    string,
    Array<{
      id: string;
      projectId: string;
      providerId: string | null;
      mode: string;
      status: string;
      promptUsed: string;
      errorMessage: string | null;
      durationMs: number | null;
      createdAt: string;
    }>
  >;
}

function slugifyLocal(input: string): string {
  return (
    input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 72) || 'sistema'
  );
}

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    meta: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

function createInitialDb(): BrowserDb {
  const now = new Date().toISOString();
  const builderId = 'user-builder-demo';
  const adminId = 'user-admin-demo';

  const barbershopBlueprint: AppBlueprint = {
    appName: 'Barbearia do Marcos',
    slug: 'barbearia-do-marcos',
    tagline: 'Gestão simples de clientes, cortes e horários marcados',
    summary:
      'Sistema completo para barbearias gerenciarem atendimentos diários, equipe e faturamento.',
    targetAudience: 'Barbearias e salões de bairro',
    primaryColor: '#1B4332',
    roles: [
      { key: 'ADMIN', label: 'Dono(a)', description: 'Controle total' },
      { key: 'BUILDER', label: 'Barbeiro', description: 'Atendimento e agenda' },
    ],
    entities: [
      {
        name: 'Cliente',
        slug: 'clientes',
        label: 'Cliente',
        pluralLabel: 'Clientes',
        description: 'Cadastro de clientes frequentes e WhatsApp.',
        icon: 'Users',
        softDelete: true,
        readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
        writeRoles: ['ADMIN', 'BUILDER'],
        fields: [
          { name: 'nome', label: 'Nome do Cliente', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'telefone', label: 'WhatsApp', type: 'phone', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'email', label: 'E-mail', type: 'email', required: false, unique: false, searchable: true, showInTable: true },
        ],
      },
      {
        name: 'Agendamento',
        slug: 'agendamentos',
        label: 'Agendamento',
        pluralLabel: 'Agendamentos',
        description: 'Horários marcados e situação do atendimento.',
        icon: 'CalendarClock',
        softDelete: true,
        readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
        writeRoles: ['ADMIN', 'BUILDER'],
        fields: [
          { name: 'clienteNome', label: 'Cliente', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'servicoTitulo', label: 'Serviço', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'dataHora', label: 'Data e Hora', type: 'datetime', required: true, unique: false, searchable: false, showInTable: true },
          { name: 'status', label: 'Situação', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO'] },
          { name: 'valorCobrado', label: 'Valor (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
        ],
      },
    ],
    workflows: [
      {
        name: 'Confirmação de Horário',
        trigger: 'Novo agendamento salvo',
        action: 'Organiza na lista do dia como PENDENTE.',
      },
    ],
  };

  const lojaBlueprint: AppBlueprint = {
    appName: 'Loja Prática',
    slug: 'loja-pratica',
    tagline: 'Controle completo de catálogo, estoque e vendas',
    summary: 'Sistema simples para acompanhar estoque e pedidos diários.',
    targetAudience: 'Pequenas lojas e autônomos',
    primaryColor: '#1B4332',
    roles: [{ key: 'ADMIN', label: 'Proprietário', description: 'Controle completo' }],
    entities: [
      {
        name: 'Produto',
        slug: 'produtos',
        label: 'Produto',
        pluralLabel: 'Produtos',
        description: 'Catálogo e quantidade em estoque.',
        icon: 'Package',
        softDelete: true,
        readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
        writeRoles: ['ADMIN', 'BUILDER'],
        fields: [
          { name: 'nome', label: 'Nome do Produto', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'categoria', label: 'Categoria', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'precoVenda', label: 'Preço (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
          { name: 'quantidadeEstoque', label: 'Estoque', type: 'int', required: true, unique: false, searchable: false, showInTable: true },
        ],
      },
      {
        name: 'Pedido',
        slug: 'pedidos',
        label: 'Pedido',
        pluralLabel: 'Pedidos',
        description: 'Vendas realizadas e entrega.',
        icon: 'ShoppingBag',
        softDelete: true,
        readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
        writeRoles: ['ADMIN', 'BUILDER'],
        fields: [
          { name: 'clienteNome', label: 'Cliente', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'valorTotal', label: 'Valor Total (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
          { name: 'statusPedido', label: 'Status', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['RECEBIDO', 'EM_PREPARO', 'ENTREGUE'] },
        ],
      },
    ],
    workflows: [],
  };

  const clinicaBlueprint: AppBlueprint = {
    appName: 'Clínica Cuidar',
    slug: 'clinica-cuidar',
    tagline: 'Gestão acolhedora de pacientes e consultas',
    summary: 'Cadastro de pacientes, profissionais e consultas agendadas.',
    targetAudience: 'Consultórios e clínicas independentes',
    primaryColor: '#1B4332',
    roles: [{ key: 'ADMIN', label: 'Gestor', description: 'Controle completo' }],
    entities: [
      {
        name: 'Paciente',
        slug: 'pacientes',
        label: 'Paciente',
        pluralLabel: 'Pacientes',
        description: 'Contatos e anotações de pacientes.',
        icon: 'Users',
        softDelete: true,
        readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
        writeRoles: ['ADMIN', 'BUILDER'],
        fields: [
          { name: 'nome', label: 'Nome Completo', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'telefone', label: 'Telefone', type: 'phone', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'email', label: 'E-mail', type: 'email', required: false, unique: false, searchable: true, showInTable: true },
        ],
      },
      {
        name: 'Consulta',
        slug: 'consultas',
        label: 'Consulta',
        pluralLabel: 'Consultas',
        description: 'Consultas marcadas e retorno.',
        icon: 'CalendarClock',
        softDelete: true,
        readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
        writeRoles: ['ADMIN', 'BUILDER'],
        fields: [
          { name: 'pacienteNome', label: 'Paciente', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'dataHora', label: 'Data e Hora', type: 'datetime', required: true, unique: false, searchable: false, showInTable: true },
          { name: 'situacao', label: 'Situação', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['AGENDADA', 'REALIZADA', 'FALTOU'] },
        ],
      },
    ],
    workflows: [],
  };

  return {
    currentUserId: builderId,
    users: [
      {
        id: builderId,
        name: 'Criador (Modo Demonstração)',
        email: 'criador@fabricalivre.org',
        role: 'BUILDER',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: adminId,
        name: 'Administrador Fábrica',
        email: 'admin@fabricalivre.org',
        role: 'ADMIN',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    providers: [
      {
        id: 'prov-offline',
        name: 'Motor Automático Offline (Instantâneo)',
        slug: 'motor-offline',
        providerType: 'BUILTIN_OFFLINE',
        authMode: 'NONE',
        subscriptionBrand: 'Fábrica Livre',
        description: 'Gera sistemas completos na hora direto no seu navegador, sem precisar de chave ou conta paga.',
        modelName: 'fabrica-nlp-ptbr-v1',
        baseUrl: null,
        cliCommand: null,
        hasApiKey: false,
        maskedApiKey: null,
        isDefault: true,
        isActive: true,
        lastTestedAt: now,
        lastTestStatus: 'OK: Motor pronto no navegador',
        ownerId: builderId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prov-antigravity',
        name: 'Antigravity (Assinatura / Ponte Guiada)',
        slug: 'antigravity-bridge',
        providerType: 'ANTIGRAVITY_AGENT',
        authMode: 'BROWSER_HANDOFF',
        subscriptionBrand: 'Antigravity',
        description: 'Gera super-prompts e pacotes AGENTS.md prontos para usar com sua conta Antigravity.',
        modelName: 'antigravity-workspace',
        baseUrl: 'https://antigravity.google',
        cliCommand: null,
        hasApiKey: false,
        maskedApiKey: null,
        isDefault: false,
        isActive: true,
        lastTestedAt: now,
        lastTestStatus: 'OK: Ponte assistida ativa',
        ownerId: builderId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prov-chatgpt',
        name: 'ChatGPT (Minha Assinatura Plus / Pro)',
        slug: 'chatgpt-bridge',
        providerType: 'SUBSCRIPTION_BRIDGE',
        authMode: 'BROWSER_HANDOFF',
        subscriptionBrand: 'ChatGPT',
        description: 'Copie o pedido estruturado, cole no ChatGPT e importe a resposta para gerar seu sistema.',
        modelName: 'chatgpt-web-bridge',
        baseUrl: 'https://chatgpt.com',
        cliCommand: null,
        hasApiKey: false,
        maskedApiKey: null,
        isDefault: false,
        isActive: true,
        lastTestedAt: now,
        lastTestStatus: 'OK: Ponte assistida ativa',
        ownerId: builderId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prov-claude',
        name: 'Claude (Minha Assinatura Pro / Max)',
        slug: 'claude-bridge',
        providerType: 'SUBSCRIPTION_BRIDGE',
        authMode: 'BROWSER_HANDOFF',
        subscriptionBrand: 'Claude',
        description: 'Use sua assinatura Claude.ai com ponte guiada sem pagar API.',
        modelName: 'claude-web-bridge',
        baseUrl: 'https://claude.ai',
        cliCommand: null,
        hasApiKey: false,
        maskedApiKey: null,
        isDefault: false,
        isActive: true,
        lastTestedAt: now,
        lastTestStatus: 'OK: Ponte assistida ativa',
        ownerId: builderId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prov-gemini',
        name: 'Gemini (Minha Assinatura Google AI)',
        slug: 'gemini-bridge',
        providerType: 'SUBSCRIPTION_BRIDGE',
        authMode: 'BROWSER_HANDOFF',
        subscriptionBrand: 'Gemini',
        description: 'Use sua assinatura Google Gemini para desenhar sistemas completos.',
        modelName: 'gemini-web-bridge',
        baseUrl: 'https://gemini.google.com',
        cliCommand: null,
        hasApiKey: false,
        maskedApiKey: null,
        isDefault: false,
        isActive: true,
        lastTestedAt: now,
        lastTestStatus: 'OK: Ponte assistida ativa',
        ownerId: builderId,
        createdAt: now,
        updatedAt: now,
      },
    ],
    templates: [
      {
        id: 'tpl-barbearia',
        name: 'Agenda Fácil para Barbearia & Salão',
        slug: 'agenda-barbearia',
        category: 'SERVICOS',
        icon: 'Scissors',
        shortDescription: 'Controle clientes, cortes, profissionais e horários marcados.',
        targetAudience: 'Barbearias, salões de beleza e estética',
        plainPromptExample: 'Quero um sistema de barbearia com cadastro de clientes, serviços e horários marcados.',
        blueprintJson: barbershopBlueprint,
        isOfficial: true,
        usageCount: 28,
        authorId: adminId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tpl-loja',
        name: 'Minha Loja & Controle de Estoque',
        slug: 'minha-loja-estoque',
        category: 'COMERCIO',
        icon: 'ShoppingBag',
        shortDescription: 'Organize produtos, estoque e pedidos de venda.',
        targetAudience: 'Pequenos comércios e lojas de bairro',
        plainPromptExample: 'Preciso controlar produtos em estoque e registrar pedidos de vendas.',
        blueprintJson: lojaBlueprint,
        isOfficial: true,
        usageCount: 19,
        authorId: adminId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'tpl-clinica',
        name: 'Clínica & Prontuário Simples',
        slug: 'clinica-simples',
        category: 'SAUDE',
        icon: 'HeartPulse',
        shortDescription: 'Cadastro de pacientes e agenda de consultas.',
        targetAudience: 'Consultórios médicos, dentistas e psicólogos',
        plainPromptExample: 'Quero organizar pacientes e consultas da minha clínica.',
        blueprintJson: clinicaBlueprint,
        isOfficial: true,
        usageCount: 14,
        authorId: adminId,
        createdAt: now,
        updatedAt: now,
      },
    ],
    projects: [
      {
        id: 'proj-demo-1',
        name: 'Barbearia do Marcos (Exemplo)',
        slug: 'barbearia-do-marcos',
        plainIdea: 'Quero controlar meus clientes e horários marcados sem depender de caderno.',
        targetAudience: 'Barbearia com 3 cadeiras',
        status: 'DESIGNED',
        blueprintJson: barbershopBlueprint,
        generatedFilesCount: 0,
        lastGeneratedAt: null,
        ownerId: builderId,
        templateId: 'tpl-barbearia',
        aiProviderId: 'prov-offline',
        createdAt: now,
        updatedAt: now,
      },
    ],
    artifactsByProject: {},
    jobsByProject: {},
  };
}

function loadDb(): BrowserDb {
  if (typeof window === 'undefined') return createInitialDb();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createInitialDb();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw) as BrowserDb;
  } catch {
    const initial = createInitialDb();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function saveDb(db: BrowserDb): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

function generateBrowserBlueprint(projectName: string, prompt: string, targetAudience?: string): AppBlueprint {
  const norm = prompt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const entities: BlueprintEntity[] = [];
  if (norm.includes('cliente') || norm.includes('paciente') || norm.includes('aluno')) {
    const isPaciente = norm.includes('paciente') || norm.includes('clinica');
    entities.push({
      name: isPaciente ? 'Paciente' : 'Cliente',
      slug: isPaciente ? 'pacientes' : 'clientes',
      label: isPaciente ? 'Paciente' : 'Cliente',
      pluralLabel: isPaciente ? 'Pacientes' : 'Clientes',
      description: 'Cadastro principal de contatos e observações.',
      icon: 'Users',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'nome', label: 'Nome Completo', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'telefone', label: 'WhatsApp / Telefone', type: 'phone', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'email', label: 'E-mail', type: 'email', required: false, unique: false, searchable: true, showInTable: true },
      ],
    });
  }

  if (norm.includes('agenda') || norm.includes('horario') || norm.includes('consulta')) {
    entities.push({
      name: 'Agendamento',
      slug: 'agendamentos',
      label: 'Agendamento',
      pluralLabel: 'Agendamentos',
      description: 'Horários marcados e situação.',
      icon: 'CalendarClock',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'clienteNome', label: 'Cliente', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'dataHora', label: 'Data e Hora', type: 'datetime', required: true, unique: false, searchable: false, showInTable: true },
        { name: 'status', label: 'Status', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['PENDENTE', 'CONFIRMADO', 'CONCLUIDO'] },
        { name: 'valor', label: 'Valor (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
      ],
    });
  }

  if (norm.includes('produto') || norm.includes('estoque') || norm.includes('loja') || norm.includes('venda') || norm.includes('pedido')) {
    entities.push({
      name: 'Produto',
      slug: 'produtos',
      label: 'Produto',
      pluralLabel: 'Produtos',
      description: 'Catálogo de itens e estoque.',
      icon: 'Package',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'nome', label: 'Produto', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'preco', label: 'Preço (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
        { name: 'estoque', label: 'Quantidade', type: 'int', required: true, unique: false, searchable: false, showInTable: true },
      ],
    });
  }

  if (norm.includes('financ') || norm.includes('caixa') || norm.includes('pagamento') || norm.includes('despesa')) {
    entities.push({
      name: 'Lancamento',
      slug: 'lancamentos',
      label: 'Lançamento',
      pluralLabel: 'Lançamentos Financeiros',
      description: 'Entradas e saídas do negócio.',
      icon: 'Wallet',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'descricao', label: 'Descrição', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'tipo', label: 'Tipo', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['ENTRADA', 'SAIDA'] },
        { name: 'valor', label: 'Valor (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
        { name: 'pago', label: 'Quitado', type: 'boolean', required: true, unique: false, searchable: false, showInTable: true },
      ],
    });
  }

  if (entities.length === 0) {
    entities.push(
      {
        name: 'CadastroPrincipal',
        slug: 'cadastros',
        label: 'Cadastro',
        pluralLabel: 'Cadastros',
        description: 'Módulo principal gerado a partir da sua descrição.',
        icon: 'FolderKanban',
        softDelete: true,
        readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
        writeRoles: ['ADMIN', 'BUILDER'],
        fields: [
          { name: 'titulo', label: 'Nome / Título', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
          { name: 'status', label: 'Situação', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['ATIVO', 'EM_ANDAMENTO', 'CONCLUIDO'] },
          { name: 'observacoes', label: 'Observações', type: 'text', required: false, unique: false, searchable: true, showInTable: false },
        ],
      },
    );
  }

  return AppBlueprintSchema.parse({
    appName: projectName,
    slug: slugifyLocal(projectName),
    tagline: `Sistema sob medida para gerenciar ${entities.map((e) => e.pluralLabel.toLowerCase()).join(', ')}`,
    summary: `Aplicação gerada automaticamente para: "${prompt}"`,
    targetAudience: targetAudience || 'Empreendedores e equipes',
    primaryColor: '#1B4332',
    roles: [
      { key: 'ADMIN', label: 'Administrador', description: 'Acesso completo' },
      { key: 'BUILDER', label: 'Equipe', description: 'Cadastro e edição diária' },
    ],
    entities,
    workflows: [
      {
        name: 'Proteção de Dados',
        trigger: 'Ao cadastrar ou excluir um item',
        action: 'Valida campos com Zod e pede confirmação antes de excluir.',
      },
    ],
  });
}

function compileBrowserArtifacts(projectId: string, blueprint: AppBlueprint): GeneratedArtifactItem[] {
  const now = new Date().toISOString();
  const files: Array<Omit<GeneratedArtifactItem, 'id' | 'sizeBytes' | 'createdAt'>> = [];

  const prismaModels = blueprint.entities
    .map((e) => {
      const fields = e.fields
        .map((f) => {
          const opt = f.required ? '' : '?';
          const pType =
            f.type === 'int'
              ? 'Int'
              : f.type === 'currency' || f.type === 'decimal'
                ? 'Decimal @db.Decimal(12,2)'
                : f.type === 'boolean'
                  ? 'Boolean @default(true)'
                  : f.type === 'date' || f.type === 'datetime'
                    ? 'DateTime'
                    : 'String';
          return `  ${f.name} ${pType}${opt}`;
        })
        .join('\n');
      return `model ${e.name} {\n  id String @id @default(cuid())\n${fields}\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  deletedAt DateTime?\n}`;
    })
    .join('\n\n');

  files.push({
    filePath: 'backend/prisma/schema.prisma',
    layer: 'DATABASE',
    language: 'prisma',
    content: `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n${prismaModels}\n`,
  });

  for (const ent of blueprint.entities) {
    files.push({
      filePath: `backend/src/modules/${ent.slug}/${ent.slug}.controller.ts`,
      layer: 'BACKEND',
      language: 'typescript',
      content: `import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';\nimport { ApiTags, ApiBearerAuth } from '@nestjs/swagger';\n\n@ApiTags('${ent.pluralLabel}')\n@ApiBearerAuth()\n@Controller('${ent.slug}')\nexport class ${ent.name}Controller {\n  @Get()\n  list() {\n    return { message: 'Endpoint paginado de ${ent.pluralLabel}' };\n  }\n\n  @Post()\n  create(@Body() dto: Record<string, unknown>) {\n    return dto;\n  }\n\n  @Patch(':id')\n  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {\n    return { id, ...dto };\n  }\n\n  @Delete(':id')\n  remove(@Param('id') id: string) {\n    return { deleted: true, id };\n  }\n}\n`,
    });

    files.push({
      filePath: `frontend/src/app/${ent.slug}/page.tsx`,
      layer: 'FRONTEND',
      language: 'tsx',
      content: `'use client';\n\nexport default function ${ent.name}Page() {\n  return (\n    <main className="mx-auto max-w-5xl p-8">\n      <h1 className="text-2xl font-bold">${ent.pluralLabel}</h1>\n      <p className="text-stone-600 mt-1">${ent.description}</p>\n    </main>\n  );\n}\n`,
    });
  }

  files.push({
    filePath: 'docker-compose.yml',
    layer: 'INFRA',
    language: 'yaml',
    content: `services:\n  postgres:\n    image: postgres:15-alpine\n    environment:\n      POSTGRES_USER: appuser\n      POSTGRES_PASSWORD: appsecret\n      POSTGRES_DB: ${blueprint.slug.replace(/-/g, '_')}\n    ports:\n      - "5432:5432"\n`,
  });

  files.push({
    filePath: 'AGENTS.md',
    layer: 'AI_PACK',
    language: 'markdown',
    content: `# ${blueprint.appName}\n\nPacote gerado pela Fábrica Livre compatível com **Antigravity**, **Claude Code**, **Codex CLI**, **Gemini CLI** e **ChatGPT**.\n`,
  });

  files.push({
    filePath: '.antigravity/blueprint.json',
    layer: 'AI_PACK',
    language: 'json',
    content: JSON.stringify(blueprint, null, 2),
  });

  files.push({
    filePath: 'README.md',
    layer: 'DOCS',
    language: 'markdown',
    content: `# ${blueprint.appName}\n\n> ${blueprint.tagline}\n\n${blueprint.summary}\n`,
  });

  return files.map((f, idx) => ({
    id: `${projectId}-art-${idx}`,
    ...f,
    sizeBytes: new Blob([f.content]).size,
    createdAt: now,
  }));
}

export async function browserFactoryRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const db = loadDb();
  const method = (options.method || 'GET').toUpperCase();
  const [pathname, queryStr] = path.split('?');
  const params = new URLSearchParams(queryStr || '');
  const body = options.body ? (JSON.parse(String(options.body)) as Record<string, unknown>) : {};
  const now = new Date().toISOString();

  if (pathname === '/auth/me') {
    const user = db.users.find((u) => u.id === db.currentUserId) || db.users[0];
    return user as T;
  }

  if (pathname === '/auth/login' || pathname === '/auth/register') {
    const email = String(body.email || '').toLowerCase();
    let user = db.users.find((u) => u.email === email);
    if (!user && pathname === '/auth/register') {
      user = {
        id: `user-${Date.now()}`,
        name: String(body.name || 'Novo Criador'),
        email,
        role: 'BUILDER',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      db.users.push(user);
    }
    if (!user) user = db.users[0];
    db.currentUserId = user.id;
    saveDb(db);
    return { accessToken: 'browser-demo-jwt', user } as T;
  }

  if (pathname === '/templates' && method === 'GET') {
    const search = (params.get('search') || '').toLowerCase();
    const category = params.get('category') || '';
    const filtered = db.templates.filter(
      (t) =>
        (!category || t.category === category) &&
        (!search ||
          t.name.toLowerCase().includes(search) ||
          t.shortDescription.toLowerCase().includes(search)),
    );
    return paginate(
      filtered,
      Number(params.get('page') || 1),
      Number(params.get('pageSize') || 10),
    ) as T;
  }

  if (pathname === '/templates' && method === 'POST') {
    const created: AppTemplateResponse = {
      id: `tpl-${Date.now()}`,
      name: String(body.name),
      slug: slugifyLocal(String(body.name)),
      category: (body.category as AppTemplateResponse['category']) || 'SERVICOS',
      icon: 'LayoutGrid',
      shortDescription: String(body.shortDescription),
      targetAudience: String(body.targetAudience),
      plainPromptExample: String(body.plainPromptExample),
      blueprintJson: body.blueprintJson as AppBlueprint,
      isOfficial: false,
      usageCount: 0,
      authorId: db.currentUserId,
      createdAt: now,
      updatedAt: now,
    };
    db.templates.unshift(created);
    saveDb(db);
    return created as T;
  }

  if (pathname.startsWith('/templates/') && method === 'DELETE') {
    const id = pathname.split('/')[2];
    db.templates = db.templates.filter((t) => t.id !== id);
    saveDb(db);
    return { deleted: true, id } as T;
  }

  if (pathname === '/ai-providers' && method === 'GET') {
    const search = (params.get('search') || '').toLowerCase();
    const authMode = params.get('authMode') || '';
    const filtered = db.providers.filter(
      (p) =>
        (!authMode || p.authMode === authMode) &&
        (!search ||
          p.name.toLowerCase().includes(search) ||
          p.subscriptionBrand.toLowerCase().includes(search)),
    );
    return paginate(
      filtered,
      Number(params.get('page') || 1),
      Number(params.get('pageSize') || 10),
    ) as T;
  }

  if (pathname === '/ai-providers' && method === 'POST') {
    const created: AiProviderResponse = {
      id: `prov-${Date.now()}`,
      name: String(body.name),
      slug: slugifyLocal(String(body.name)),
      providerType: body.providerType as AiProviderResponse['providerType'],
      authMode: body.authMode as AiProviderResponse['authMode'],
      subscriptionBrand: String(body.subscriptionBrand),
      description: (body.description as string) || null,
      modelName: (body.modelName as string) || null,
      baseUrl: (body.baseUrl as string) || null,
      cliCommand: (body.cliCommand as string) || null,
      hasApiKey: Boolean(body.apiKey),
      maskedApiKey: body.apiKey ? 'sk-••••demo' : null,
      isDefault: Boolean(body.isDefault),
      isActive: true,
      lastTestedAt: null,
      lastTestStatus: 'Adicionado no navegador',
      ownerId: db.currentUserId,
      createdAt: now,
      updatedAt: now,
    };
    db.providers.unshift(created);
    saveDb(db);
    return created as T;
  }

  const testMatch = pathname.match(/^\/ai-providers\/([^/]+)\/test$/);
  if (testMatch && method === 'POST') {
    const prov = db.providers.find((p) => p.id === testMatch[1]);
    return {
      success: true,
      providerId: testMatch[1],
      mode: prov?.authMode || 'NONE',
      message: `Conector "${prov?.subscriptionBrand || 'IA'}" validado no navegador!`,
      testedAt: now,
    } as T;
  }

  if (pathname.startsWith('/ai-providers/') && method === 'DELETE') {
    const id = pathname.split('/')[2];
    db.providers = db.providers.filter((p) => p.id !== id);
    saveDb(db);
    return { deleted: true, id } as T;
  }

  if (pathname === '/projects' && method === 'GET') {
    const search = (params.get('search') || '').toLowerCase();
    const status = params.get('status') || '';
    const filtered = db.projects.filter(
      (p) =>
        (!status || p.status === status) &&
        (!search ||
          p.name.toLowerCase().includes(search) ||
          p.plainIdea.toLowerCase().includes(search)),
    );
    return paginate(
      filtered,
      Number(params.get('page') || 1),
      Number(params.get('pageSize') || 10),
    ) as T;
  }

  if (pathname === '/projects' && method === 'POST') {
    const tpl = body.templateId ? db.templates.find((t) => t.id === body.templateId) : null;
    const blueprint = tpl
      ? { ...structuredClone(tpl.blueprintJson), appName: String(body.name), slug: slugifyLocal(String(body.name)) }
      : null;

    const created: SoftwareProjectResponse = {
      id: `proj-${Date.now()}`,
      name: String(body.name),
      slug: slugifyLocal(String(body.name)),
      plainIdea: String(body.plainIdea),
      targetAudience: (body.targetAudience as string) || null,
      status: blueprint ? 'DESIGNED' : 'DRAFT',
      blueprintJson: blueprint,
      generatedFilesCount: 0,
      lastGeneratedAt: null,
      ownerId: db.currentUserId,
      templateId: tpl?.id || null,
      aiProviderId: (body.aiProviderId as string) || null,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.unshift(created);
    saveDb(db);
    return created as T;
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    const id = projectMatch[1];
    const proj = db.projects.find((p) => p.id === id);
    if (!proj) throw new Error('Projeto não encontrado.');

    if (method === 'GET') return proj as T;
    if (method === 'PATCH') {
      Object.assign(proj, body, { updatedAt: now });
      if (body.blueprintJson && proj.status === 'DRAFT') proj.status = 'DESIGNED';
      saveDb(db);
      return proj as T;
    }
    if (method === 'DELETE') {
      db.projects = db.projects.filter((p) => p.id !== id);
      saveDb(db);
      return { deleted: true, id } as T;
    }
  }

  const genBpMatch = pathname.match(/^\/projects\/([^/]+)\/generate-blueprint$/);
  if (genBpMatch && method === 'POST') {
    const proj = db.projects.find((p) => p.id === genBpMatch[1]);
    if (!proj) throw new Error('Projeto não encontrado.');
    const blueprint = generateBrowserBlueprint(
      proj.name,
      String(body.prompt || proj.plainIdea),
      proj.targetAudience || undefined,
    );
    proj.blueprintJson = blueprint;
    proj.status = 'DESIGNED';
    proj.updatedAt = now;
    saveDb(db);
    return { project: proj, blueprint } as T;
  }

  const handoffMatch = pathname.match(/^\/projects\/([^/]+)\/handoff-prompt$/);
  if (handoffMatch && method === 'POST') {
    const proj = db.projects.find((p) => p.id === handoffMatch[1]);
    const platform = (body.targetPlatform as TargetAiPlatform) || 'ANTIGRAVITY';
    const launchMap: Record<TargetAiPlatform, string> = {
      ANTIGRAVITY: 'https://antigravity.google',
      CHATGPT: 'https://chatgpt.com',
      CLAUDE: 'https://claude.ai',
      GEMINI: 'https://gemini.google.com',
      GENERIC: 'https://chatgpt.com',
    };
    const pkg: HandoffPromptPackage = {
      targetPlatform: platform,
      launchUrl: launchMap[platform],
      platformInstructions: `1) Copie o pedido estruturado. 2) Cole na sua assinatura ${platform}. 3) Cole o JSON retornado abaixo.`,
      superPrompt: `Gere um JSON AppBlueprint válido (chaves: appName, slug, tagline, summary, entities) para "${proj?.name || 'Sistema'}": ${String(body.prompt)}`,
      jobId: `job-${Date.now()}`,
    };
    return pkg as T;
  }

  const importMatch = pathname.match(/^\/projects\/([^/]+)\/import-handoff$/);
  if (importMatch && method === 'POST') {
    const proj = db.projects.find((p) => p.id === importMatch[1]);
    if (!proj) throw new Error('Projeto não encontrado.');
    const raw = String(body.rawAiResponse || '');
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonText = fence?.[1] || raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    const parsed = AppBlueprintSchema.parse(JSON.parse(jsonText));
    proj.blueprintJson = parsed;
    proj.status = 'DESIGNED';
    proj.updatedAt = now;
    saveDb(db);
    return { project: proj, blueprint: parsed } as T;
  }

  const genCodeMatch = pathname.match(/^\/projects\/([^/]+)\/generate-code$/);
  if (genCodeMatch && method === 'POST') {
    const proj = db.projects.find((p) => p.id === genCodeMatch[1]);
    if (!proj) throw new Error('Projeto não encontrado.');
    const blueprint =
      proj.blueprintJson || generateBrowserBlueprint(proj.name, proj.plainIdea);
    proj.blueprintJson = blueprint;
    const artifacts = compileBrowserArtifacts(proj.id, blueprint);
    db.artifactsByProject[proj.id] = artifacts;
    proj.generatedFilesCount = artifacts.length;
    proj.status = 'GENERATED';
    proj.lastGeneratedAt = now;
    saveDb(db);
    const bundle: ProjectArtifactsBundleResponse = {
      projectId: proj.id,
      blueprint,
      artifacts,
      jobs: db.jobsByProject[proj.id] || [],
    };
    return bundle as T;
  }

  const artifactsMatch = pathname.match(/^\/projects\/([^/]+)\/artifacts$/);
  if (artifactsMatch && method === 'GET') {
    const proj = db.projects.find((p) => p.id === artifactsMatch[1]);
    if (!proj) throw new Error('Projeto não encontrado.');
    return {
      projectId: proj.id,
      blueprint: proj.blueprintJson,
      artifacts: db.artifactsByProject[proj.id] || [],
      jobs: db.jobsByProject[proj.id] || [],
    } as T;
  }

  if (pathname === '/users' && method === 'GET') {
    return paginate(db.users, Number(params.get('page') || 1), 10) as T;
  }

  throw new Error(`Operação não suportada no modo demonstração (${method} ${pathname}).`);
}

export async function browserFactoryDownloadZip(
  path: string,
  fallbackFilename: string,
): Promise<void> {
  const match = path.match(/^\/projects\/([^/]+)\/download$/);
  if (!match) return;
  const db = loadDb();
  const proj = db.projects.find((p) => p.id === match[1]);
  if (!proj) throw new Error('Projeto não encontrado.');

  const blueprint =
    proj.blueprintJson || generateBrowserBlueprint(proj.name, proj.plainIdea);
  const artifacts =
    db.artifactsByProject[proj.id]?.length
      ? db.artifactsByProject[proj.id]
      : compileBrowserArtifacts(proj.id, blueprint);

  const zip = new JSZip();
  const folder = zip.folder(proj.slug) || zip;
  for (const art of artifacts) {
    folder.file(art.filePath, art.content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  proj.status = 'EXPORTED' as ProjectStatus;
  saveDb(db);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${proj.slug}.zip` || fallbackFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

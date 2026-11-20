import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppBlueprint } from '@software-factory/shared';

const prisma = new PrismaClient();

const TEMPLATES: Array<{
  name: string;
  slug: string;
  category: 'SERVICOS' | 'COMERCIO' | 'SAUDE' | 'FINANCAS' | 'EDUCACAO';
  icon: string;
  shortDescription: string;
  targetAudience: string;
  plainPromptExample: string;
  blueprintJson: AppBlueprint;
}> = [
  {
    name: 'Agenda Fácil para Barbearia & Salão',
    slug: 'agenda-facil-barbearia',
    category: 'SERVICOS',
    icon: 'Scissors',
    shortDescription:
      'Controle clientes, cortes, profissionais e horários marcados sem planilhas complicadas.',
    targetAudience: 'Barbearias, salões de beleza e estúdios de estética',
    plainPromptExample:
      'Quero um sistema simples para minha barbearia com cadastro de clientes, serviços com preço, barbeiros e agenda de horários.',
    blueprintJson: {
      appName: 'Agenda Bela Corte',
      slug: 'agenda-bela-corte',
      tagline: 'Gestão simples de clientes, serviços e horários marcados',
      summary:
        'Sistema completo para barbearias e salões gerenciarem atendimentos diários, equipe e faturamento.',
      targetAudience: 'Barbearias e salões de beleza',
      primaryColor: '#1B4332',
      roles: [
        { key: 'ADMIN', label: 'Dono(a)', description: 'Controle total do salão e exclusões' },
        { key: 'BUILDER', label: 'Profissional', description: 'Gerencia agenda e clientes' },
        { key: 'VIEWER', label: 'Recepção (Leitura)', description: 'Consulta agenda do dia' },
      ],
      entities: [
        {
          name: 'Cliente',
          slug: 'clientes',
          label: 'Cliente',
          pluralLabel: 'Clientes',
          description: 'Cadastro de clientes frequentes e telefone de contato.',
          icon: 'Users',
          softDelete: true,
          readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
          writeRoles: ['ADMIN', 'BUILDER'],
          fields: [
            { name: 'nome', label: 'Nome do Cliente', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'telefone', label: 'WhatsApp', type: 'phone', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'email', label: 'E-mail', type: 'email', required: false, unique: false, searchable: true, showInTable: true },
            { name: 'observacoes', label: 'Preferências', type: 'text', required: false, unique: false, searchable: false, showInTable: false },
          ],
        },
        {
          name: 'Servico',
          slug: 'servicos',
          label: 'Serviço',
          pluralLabel: 'Serviços',
          description: 'Cortes, barba, hidratação e valores cobrados.',
          icon: 'Briefcase',
          softDelete: true,
          readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
          writeRoles: ['ADMIN', 'BUILDER'],
          fields: [
            { name: 'titulo', label: 'Nome do Serviço', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'preco', label: 'Valor (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
            { name: 'duracaoMinutos', label: 'Duração (min)', type: 'int', required: true, unique: false, searchable: false, showInTable: true },
            { name: 'ativo', label: 'Disponível', type: 'boolean', required: true, unique: false, searchable: false, showInTable: true },
          ],
        },
        {
          name: 'Agendamento',
          slug: 'agendamentos',
          label: 'Agendamento',
          pluralLabel: 'Agendamentos',
          description: 'Horários marcados por cliente e situação do atendimento.',
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
          trigger: 'Ao cadastrar um novo agendamento',
          action: 'Marca como PENDENTE e organiza na lista do dia para confirmação rápida.',
        },
      ],
    },
  },
  {
    name: 'Minha Loja & Controle de Estoque',
    slug: 'minha-loja-estoque',
    category: 'COMERCIO',
    icon: 'ShoppingBag',
    shortDescription:
      'Organize produtos, quantidades em estoque, fornecedores e pedidos de venda.',
    targetAudience: 'Pequenos comércios, lojas de roupas e mercados de bairro',
    plainPromptExample:
      'Preciso controlar o estoque de produtos da minha loja, fornecedores e registrar pedidos de vendas dos clientes.',
    blueprintJson: {
      appName: 'Loja Prática',
      slug: 'loja-pratica',
      tagline: 'Controle completo de catálogo, estoque e vendas',
      summary: 'Sistema acessível para pequenos lojistas acompanharem estoque e vendas diárias.',
      targetAudience: 'Pequenas lojas e autônomos',
      primaryColor: '#1B4332',
      roles: [
        { key: 'ADMIN', label: 'Proprietário', description: 'Gerencia preços, estoque e vendas' },
        { key: 'BUILDER', label: 'Vendedor', description: 'Registra vendas e consulta produtos' },
      ],
      entities: [
        {
          name: 'Produto',
          slug: 'produtos',
          label: 'Produto',
          pluralLabel: 'Produtos',
          description: 'Catálogo de mercadorias e controle de estoque.',
          icon: 'Package',
          softDelete: true,
          readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
          writeRoles: ['ADMIN', 'BUILDER'],
          fields: [
            { name: 'nome', label: 'Nome do Produto', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'codigoSku', label: 'Código / SKU', type: 'string', required: true, unique: true, searchable: true, showInTable: true },
            { name: 'categoria', label: 'Categoria', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'precoVenda', label: 'Preço (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
            { name: 'quantidadeEstoque', label: 'Em Estoque', type: 'int', required: true, unique: false, searchable: false, showInTable: true },
          ],
        },
        {
          name: 'Pedido',
          slug: 'pedidos',
          label: 'Pedido',
          pluralLabel: 'Pedidos de Venda',
          description: 'Vendas realizadas e status de entrega.',
          icon: 'ShoppingBag',
          softDelete: true,
          readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
          writeRoles: ['ADMIN', 'BUILDER'],
          fields: [
            { name: 'codigoPedido', label: 'Número', type: 'string', required: true, unique: true, searchable: true, showInTable: true },
            { name: 'clienteNome', label: 'Cliente', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'valorTotal', label: 'Valor Total (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
            { name: 'statusPedido', label: 'Status', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['RECEBIDO', 'EM_PREPARO', 'ENTREGUE', 'CANCELADO'] },
          ],
        },
      ],
      workflows: [
        {
          name: 'Alerta de Reposição',
          trigger: 'Quando a quantidade em estoque ficar abaixo de 5 unidades',
          action: 'Destaca o produto para compra junto ao fornecedor.',
        },
      ],
    },
  },
  {
    name: 'Clínica & Prontuário Simples',
    slug: 'clinica-prontuario-simples',
    category: 'SAUDE',
    icon: 'HeartPulse',
    shortDescription:
      'Cadastro de pacientes, profissionais da saúde e consultas agendadas.',
    targetAudience: 'Consultórios médicos, psicólogos, fisioterapeutas e clínicas',
    plainPromptExample:
      'Quero organizar pacientes, consultas e profissionais da minha clínica de atendimento.',
    blueprintJson: {
      appName: 'Clínica Cuidar',
      slug: 'clinica-cuidar',
      tagline: 'Gestão acolhedora de pacientes e consultas',
      summary: 'Sistema clínico simplificado com cadastro seguro e histórico organizado.',
      targetAudience: 'Consultórios e clínicas independentes',
      primaryColor: '#1B4332',
      roles: [
        { key: 'ADMIN', label: 'Gestor da Clínica', description: 'Acesso completo' },
        { key: 'BUILDER', label: 'Profissional / Secretária', description: 'Agenda e fichas' },
      ],
      entities: [
        {
          name: 'Paciente',
          slug: 'pacientes',
          label: 'Paciente',
          pluralLabel: 'Pacientes',
          description: 'Dados de contato e observações importantes do paciente.',
          icon: 'Users',
          softDelete: true,
          readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
          writeRoles: ['ADMIN', 'BUILDER'],
          fields: [
            { name: 'nome', label: 'Nome Completo', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'telefone', label: 'Telefone', type: 'phone', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'email', label: 'E-mail', type: 'email', required: false, unique: false, searchable: true, showInTable: true },
            { name: 'observacoes', label: 'Anotações Clínicas', type: 'text', required: false, unique: false, searchable: false, showInTable: false },
          ],
        },
        {
          name: 'Consulta',
          slug: 'consultas',
          label: 'Consulta',
          pluralLabel: 'Consultas',
          description: 'Atendimentos marcados e retorno de pacientes.',
          icon: 'CalendarClock',
          softDelete: true,
          readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
          writeRoles: ['ADMIN', 'BUILDER'],
          fields: [
            { name: 'pacienteNome', label: 'Paciente', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'profissional', label: 'Profissional', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'dataHora', label: 'Data e Hora', type: 'datetime', required: true, unique: false, searchable: false, showInTable: true },
            { name: 'situacao', label: 'Situação', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['AGENDADA', 'EM_ATENDIMENTO', 'REALIZADA', 'FALTOU'] },
          ],
        },
      ],
      workflows: [],
    },
  },
  {
    name: 'Caixa & Finanças para Autônomos',
    slug: 'caixa-financas-autonomos',
    category: 'FINANCAS',
    icon: 'Wallet',
    shortDescription:
      'Registre entradas, contas a pagar, categorias e acompanhe o saldo do mês.',
    targetAudience: 'Prestadores de serviço, MEIs e profissionais autônomos',
    plainPromptExample:
      'Quero controlar minhas receitas e despesas mensais como autônomo com aviso do que já foi pago.',
    blueprintJson: {
      appName: 'Caixa Claro',
      slug: 'caixa-claro',
      tagline: 'Controle financeiro sem termos complicados',
      summary: 'Organize o dinheiro que entra e sai do seu negócio em poucos cliques.',
      targetAudience: 'MEIs e autônomos',
      primaryColor: '#1B4332',
      roles: [
        { key: 'ADMIN', label: 'Responsável', description: 'Gerencia lançamentos financeiros' },
      ],
      entities: [
        {
          name: 'Lancamento',
          slug: 'lancamentos',
          label: 'Lançamento',
          pluralLabel: 'Lançamentos',
          description: 'Entradas de vendas e saídas de despesas.',
          icon: 'Wallet',
          softDelete: true,
          readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
          writeRoles: ['ADMIN', 'BUILDER'],
          fields: [
            { name: 'descricao', label: 'Descrição', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'tipo', label: 'Tipo', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['ENTRADA', 'SAIDA'] },
            { name: 'categoria', label: 'Categoria', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
            { name: 'valor', label: 'Valor (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
            { name: 'dataVencimento', label: 'Vencimento', type: 'date', required: true, unique: false, searchable: false, showInTable: true },
            { name: 'pago', label: 'Quitado', type: 'boolean', required: true, unique: false, searchable: false, showInTable: true },
          ],
        },
      ],
      workflows: [],
    },
  },
];

async function seed(): Promise<void> {
  console.log('Iniciando seed do banco Fábrica Livre...');

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const builderPassword = await bcrypt.hash('Criador@123', 10);
  const viewerPassword = await bcrypt.hash('Visitante@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fabricalivre.org' },
    update: {},
    create: {
      name: 'Administrador Fábrica',
      email: 'admin@fabricalivre.org',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const builder = await prisma.user.upsert({
    where: { email: 'criador@fabricalivre.org' },
    update: {},
    create: {
      name: 'Ana Criadora (Sem Código)',
      email: 'criador@fabricalivre.org',
      passwordHash: builderPassword,
      role: 'BUILDER',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'visitante@fabricalivre.org' },
    update: {},
    create: {
      name: 'Visitante Consulta',
      email: 'visitante@fabricalivre.org',
      passwordHash: viewerPassword,
      role: 'VIEWER',
      isActive: true,
    },
  });

  for (const tpl of TEMPLATES) {
    await prisma.appTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        name: tpl.name,
        shortDescription: tpl.shortDescription,
        blueprintJson: tpl.blueprintJson as unknown as Prisma.InputJsonValue,
      },
      create: {
        name: tpl.name,
        slug: tpl.slug,
        category: tpl.category,
        icon: tpl.icon,
        shortDescription: tpl.shortDescription,
        targetAudience: tpl.targetAudience,
        plainPromptExample: tpl.plainPromptExample,
        blueprintJson: tpl.blueprintJson as unknown as Prisma.InputJsonValue,
        isOfficial: true,
        usageCount: 12,
        authorId: admin.id,
      },
    });
  }

  const defaultProviders = [
    {
      name: 'Motor Automático Offline (Zero Configuração)',
      slug: 'motor-automatico-offline',
      providerType: 'BUILTIN_OFFLINE' as const,
      authMode: 'NONE' as const,
      subscriptionBrand: 'Fábrica Livre',
      description: 'Funciona imediatamente sem assinatura paga ou chave API.',
      modelName: 'fabrica-nlp-ptbr-v1',
      isDefault: true,
      lastTestStatus: 'Pronto para uso imediato',
    },
    {
      name: 'Antigravity (Agente & Ponte Guiada)',
      slug: 'antigravity-bridge',
      providerType: 'ANTIGRAVITY_AGENT' as const,
      authMode: 'BROWSER_HANDOFF' as const,
      subscriptionBrand: 'Antigravity',
      description: 'Integra sua conta Antigravity gerando super-prompts e pacotes AGENTS.md.',
      modelName: 'antigravity-workspace',
      isDefault: false,
      lastTestStatus: 'Modo Ponte Assistida ativo',
    },
    {
      name: 'ChatGPT (Minha Assinatura Plus / Pro)',
      slug: 'chatgpt-assinatura',
      providerType: 'SUBSCRIPTION_BRIDGE' as const,
      authMode: 'BROWSER_HANDOFF' as const,
      subscriptionBrand: 'ChatGPT',
      description: 'Use sua assinatura ChatGPT sem API paga: gere o pedido, cole no chat e importe.',
      modelName: 'chatgpt-web-bridge',
      baseUrl: 'https://chatgpt.com',
      isDefault: false,
      lastTestStatus: 'Modo Assinatura Web ativo',
    },
    {
      name: 'Claude (Minha Assinatura Pro / Max)',
      slug: 'claude-assinatura',
      providerType: 'SUBSCRIPTION_BRIDGE' as const,
      authMode: 'BROWSER_HANDOFF' as const,
      subscriptionBrand: 'Claude',
      description: 'Use sua assinatura Claude.ai sem configuração complexa.',
      modelName: 'claude-web-bridge',
      baseUrl: 'https://claude.ai',
      isDefault: false,
      lastTestStatus: 'Modo Assinatura Web ativo',
    },
    {
      name: 'Gemini (Minha Assinatura Google AI)',
      slug: 'gemini-assinatura',
      providerType: 'SUBSCRIPTION_BRIDGE' as const,
      authMode: 'BROWSER_HANDOFF' as const,
      subscriptionBrand: 'Gemini',
      description: 'Use sua assinatura Google Gemini para desenhar sistemas completos.',
      modelName: 'gemini-web-bridge',
      baseUrl: 'https://gemini.google.com',
      isDefault: false,
      lastTestStatus: 'Modo Assinatura Web ativo',
    },
    {
      name: 'Claude Code CLI (Assinatura Local)',
      slug: 'claude-code-cli',
      providerType: 'CLAUDE_CLI' as const,
      authMode: 'LOCAL_CLI' as const,
      subscriptionBrand: 'Claude Code',
      description: 'Executa automaticamente o CLI oficial `claude` se instalado no servidor.',
      cliCommand: 'claude',
      isDefault: false,
      lastTestStatus: 'Aguardando teste de CLI local',
    },
    {
      name: 'Ollama Local (IA Open-Source no seu PC)',
      slug: 'ollama-local',
      providerType: 'OLLAMA_LOCAL' as const,
      authMode: 'LOCAL_SERVER' as const,
      subscriptionBrand: 'Ollama',
      description: 'Roda modelos abertos (Llama, Qwen, DeepSeek) 100% no seu computador.',
      modelName: 'llama3.1',
      baseUrl: 'http://localhost:11434',
      isDefault: false,
      lastTestStatus: 'Aguardando teste de conexão local',
    },
  ];

  for (const ownerId of [admin.id, builder.id]) {
    for (const p of defaultProviders) {
      await prisma.aiProviderConnection.upsert({
        where: {
          ownerId_slug: {
            ownerId,
            slug: p.slug,
          },
        },
        update: {},
        create: {
          ...p,
          isActive: true,
          ownerId,
        },
      });
    }
  }

  const barbershopTemplate = TEMPLATES[0];
  await prisma.softwareProject.upsert({
    where: {
      ownerId_slug: {
        ownerId: builder.id,
        slug: 'barbearia-do-marcos',
      },
    },
    update: {},
    create: {
      name: 'Barbearia do Marcos (Exemplo)',
      slug: 'barbearia-do-marcos',
      plainIdea:
        'Quero controlar meus clientes, cortes disponíveis e agenda de horários sem depender de caderno.',
      targetAudience: 'Barbearia de bairro com 3 cadeiras',
      status: 'DESIGNED',
      blueprintJson: barbershopTemplate.blueprintJson as unknown as Prisma.InputJsonValue,
      ownerId: builder.id,
    },
  });

  console.log('Seed concluído com sucesso!');
}

seed()
  .catch((err) => {
    console.error('Erro ao executar seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

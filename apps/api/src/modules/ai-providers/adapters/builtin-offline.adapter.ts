import { Injectable } from '@nestjs/common';
import { AppBlueprint, AppBlueprintSchema, BlueprintEntity } from '@software-factory/shared';
import { slugify, toPascalCase } from '../../../common/utils/slugify.util';

interface EntityPreset {
  keywords: string[];
  entity: BlueprintEntity;
}

const ENTITY_CATALOG: EntityPreset[] = [
  {
    keywords: ['cliente', 'clientes', 'tutor', 'tutores', 'paciente', 'pacientes', 'aluno', 'alunos', 'contato', 'contatos'],
    entity: {
      name: 'Cliente',
      slug: 'clientes',
      label: 'Cliente',
      pluralLabel: 'Clientes',
      description: 'Cadastro completo de clientes com contatos e observações.',
      icon: 'Users',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'nome', label: 'Nome Completo', type: 'string', required: true, unique: false, searchable: true, showInTable: true, placeholder: 'Ex: Maria Silva' },
        { name: 'telefone', label: 'WhatsApp / Telefone', type: 'phone', required: true, unique: false, searchable: true, showInTable: true, placeholder: '(11) 99999-9999' },
        { name: 'email', label: 'E-mail', type: 'email', required: false, unique: false, searchable: true, showInTable: true, placeholder: 'cliente@email.com' },
        { name: 'observacoes', label: 'Observações', type: 'text', required: false, unique: false, searchable: false, showInTable: false, placeholder: 'Preferências ou histórico' },
        { name: 'ativo', label: 'Cadastro Ativo', type: 'boolean', required: true, unique: false, searchable: false, showInTable: true },
      ],
    },
  },
  {
    keywords: ['servico', 'servicos', 'corte', 'procedimento', 'procedimentos', 'consulta', 'consultas', 'aula', 'aulas'],
    entity: {
      name: 'Servico',
      slug: 'servicos',
      label: 'Serviço',
      pluralLabel: 'Serviços',
      description: 'Catálogo de serviços oferecidos, duração e valores.',
      icon: 'Briefcase',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'titulo', label: 'Nome do Serviço', type: 'string', required: true, unique: false, searchable: true, showInTable: true, placeholder: 'Ex: Atendimento Completo' },
        { name: 'preco', label: 'Valor (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true, placeholder: '80.00' },
        { name: 'duracaoMinutos', label: 'Duração (minutos)', type: 'int', required: true, unique: false, searchable: false, showInTable: true, placeholder: '45' },
        { name: 'descricao', label: 'Descrição', type: 'text', required: false, unique: false, searchable: true, showInTable: false },
        { name: 'disponivel', label: 'Disponível para Agenda', type: 'boolean', required: true, unique: false, searchable: false, showInTable: true },
      ],
    },
  },
  {
    keywords: ['agenda', 'agendamento', 'agendamentos', 'horario', 'horarios', 'reserva', 'reservas', 'marcacao'],
    entity: {
      name: 'Agendamento',
      slug: 'agendamentos',
      label: 'Agendamento',
      pluralLabel: 'Agendamentos',
      description: 'Controle de horários marcados, status e confirmação.',
      icon: 'CalendarClock',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'clienteNome', label: 'Nome do Cliente', type: 'string', required: true, unique: false, searchable: true, showInTable: true, placeholder: 'Quem será atendido' },
        { name: 'servicoNome', label: 'Serviço Escolhido', type: 'string', required: true, unique: false, searchable: true, showInTable: true, placeholder: 'Ex: Corte + Barba' },
        { name: 'dataHora', label: 'Data e Horário', type: 'datetime', required: true, unique: false, searchable: false, showInTable: true },
        { name: 'status', label: 'Situação', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO'] },
        { name: 'valorCobrado', label: 'Valor Total (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
        { name: 'observacoes', label: 'Notas do Atendimento', type: 'text', required: false, unique: false, searchable: false, showInTable: false },
      ],
    },
  },
  {
    keywords: ['produto', 'produtos', 'estoque', 'roupa', 'roupas', 'peca', 'pecas', 'item', 'itens', 'catalogo', 'loja'],
    entity: {
      name: 'Produto',
      slug: 'produtos',
      label: 'Produto',
      pluralLabel: 'Produtos',
      description: 'Controle de produtos, preços e quantidade em estoque.',
      icon: 'Package',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'nome', label: 'Nome do Produto', type: 'string', required: true, unique: false, searchable: true, showInTable: true, placeholder: 'Ex: Camiseta Algodão' },
        { name: 'codigoSku', label: 'Código / SKU', type: 'string', required: true, unique: true, searchable: true, showInTable: true, placeholder: 'PRD-001' },
        { name: 'categoria', label: 'Categoria', type: 'string', required: true, unique: false, searchable: true, showInTable: true, placeholder: 'Vestuário' },
        { name: 'precoVenda', label: 'Preço de Venda (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
        { name: 'quantidadeEstoque', label: 'Estoque Atual', type: 'int', required: true, unique: false, searchable: false, showInTable: true },
        { name: 'ativo', label: 'Produto Ativo', type: 'boolean', required: true, unique: false, searchable: false, showInTable: true },
      ],
    },
  },
  {
    keywords: ['venda', 'vendas', 'pedido', 'pedidos', 'encomenda', 'encomendas', 'delivery', 'ordem', 'ordens'],
    entity: {
      name: 'Pedido',
      slug: 'pedidos',
      label: 'Pedido',
      pluralLabel: 'Pedidos',
      description: 'Registro de vendas, pedidos e status de entrega.',
      icon: 'ShoppingBag',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'codigoPedido', label: 'Número do Pedido', type: 'string', required: true, unique: true, searchable: true, showInTable: true, placeholder: 'PED-2026-001' },
        { name: 'clienteNome', label: 'Cliente', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'resumoItens', label: 'Itens do Pedido', type: 'text', required: true, unique: false, searchable: true, showInTable: false },
        { name: 'valorTotal', label: 'Valor Total (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
        { name: 'statusPedido', label: 'Status', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['RECEBIDO', 'EM_PREPARO', 'ENVIADO', 'ENTREGUE', 'CANCELADO'] },
        { name: 'dataPedido', label: 'Data do Pedido', type: 'datetime', required: true, unique: false, searchable: false, showInTable: true },
      ],
    },
  },
  {
    keywords: ['financeiro', 'pagamento', 'pagamentos', 'caixa', 'despesa', 'despesas', 'receita', 'receitas', 'conta', 'contas', 'faturamento'],
    entity: {
      name: 'LancamentoFinanceiro',
      slug: 'lancamentos-financeiros',
      label: 'Lançamento',
      pluralLabel: 'Lançamentos Financeiros',
      description: 'Controle de entradas, saídas, vencimentos e pagamentos.',
      icon: 'Wallet',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'descricao', label: 'Descrição', type: 'string', required: true, unique: false, searchable: true, showInTable: true, placeholder: 'Ex: Venda do dia / Aluguel' },
        { name: 'tipo', label: 'Tipo', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['ENTRADA', 'SAIDA'] },
        { name: 'categoria', label: 'Categoria', type: 'string', required: true, unique: false, searchable: true, showInTable: true, placeholder: 'Vendas / Fornecedores' },
        { name: 'valor', label: 'Valor (R$)', type: 'currency', required: true, unique: false, searchable: false, showInTable: true },
        { name: 'dataVencimento', label: 'Data', type: 'date', required: true, unique: false, searchable: false, showInTable: true },
        { name: 'pago', label: 'Pago / Recebido', type: 'boolean', required: true, unique: false, searchable: false, showInTable: true },
      ],
    },
  },
  {
    keywords: ['fornecedor', 'fornecedores', 'parceiro', 'parceiros'],
    entity: {
      name: 'Fornecedor',
      slug: 'fornecedores',
      label: 'Fornecedor',
      pluralLabel: 'Fornecedores',
      description: 'Empresas e contatos de fornecedores parceiros.',
      icon: 'Truck',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'razaoSocial', label: 'Nome / Empresa', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'contatoNome', label: 'Pessoa de Contato', type: 'string', required: false, unique: false, searchable: true, showInTable: true },
        { name: 'telefone', label: 'Telefone', type: 'phone', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'email', label: 'E-mail', type: 'email', required: false, unique: false, searchable: true, showInTable: true },
      ],
    },
  },
  {
    keywords: ['profissional', 'profissionais', 'barbeiro', 'barbeiros', 'medico', 'medicos', 'funcionario', 'funcionarios', 'equipe', 'professor', 'professores'],
    entity: {
      name: 'Profissional',
      slug: 'profissionais',
      label: 'Profissional',
      pluralLabel: 'Equipe & Profissionais',
      description: 'Cadastro dos colaboradores responsáveis pelo atendimento.',
      icon: 'UserCheck',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'nome', label: 'Nome do Profissional', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'especialidade', label: 'Especialidade / Função', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'telefone', label: 'Telefone', type: 'phone', required: false, unique: false, searchable: true, showInTable: true },
        { name: 'ativo', label: 'Em Atividade', type: 'boolean', required: true, unique: false, searchable: false, showInTable: true },
      ],
    },
  },
  {
    keywords: ['veiculo', 'veiculos', 'carro', 'carros', 'moto', 'motos', 'oficina', 'pet', 'pets', 'animal', 'animais', 'imovel', 'imoveis'],
    entity: {
      name: 'ItemAtendido',
      slug: 'itens-atendidos',
      label: 'Ficha de Item',
      pluralLabel: 'Itens / Prontuários',
      description: 'Registro detalhado do item, veículo, pet ou imóvel acompanhado.',
      icon: 'ClipboardList',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'identificacao', label: 'Nome / Identificação', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'responsavel', label: 'Responsável / Dono', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'detalhes', label: 'Detalhes Técnicos / Histórico', type: 'text', required: false, unique: false, searchable: true, showInTable: false },
        { name: 'status', label: 'Situação Atual', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['ATIVO', 'EM_ANDAMENTO', 'FINALIZADO'] },
      ],
    },
  },
  {
    keywords: ['tarefa', 'tarefas', 'projeto', 'projetos', 'atividade', 'atividades', 'chamado', 'chamados', 'ticket', 'tickets'],
    entity: {
      name: 'Tarefa',
      slug: 'tarefas',
      label: 'Tarefa',
      pluralLabel: 'Tarefas & Chamados',
      description: 'Acompanhamento de demandas, prazos e responsáveis.',
      icon: 'CheckSquare',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        { name: 'titulo', label: 'Título da Tarefa', type: 'string', required: true, unique: false, searchable: true, showInTable: true },
        { name: 'responsavel', label: 'Responsável', type: 'string', required: false, unique: false, searchable: true, showInTable: true },
        { name: 'prioridade', label: 'Prioridade', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] },
        { name: 'status', label: 'Andamento', type: 'enum', required: true, unique: false, searchable: true, showInTable: true, enumValues: ['A_FAZER', 'FAZENDO', 'CONCLUIDA'] },
        { name: 'prazo', label: 'Prazo', type: 'date', required: false, unique: false, searchable: false, showInTable: true },
        { name: 'descricao', label: 'Descrição', type: 'text', required: false, unique: false, searchable: true, showInTable: false },
      ],
    },
  },
];

@Injectable()
export class BuiltinOfflineAdapter {
  generateFromPrompt(input: {
    projectName: string;
    prompt: string;
    targetAudience?: string;
  }): AppBlueprint {
    const normalized = input.prompt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const matchedEntities: BlueprintEntity[] = [];
    const seenSlugs = new Set<string>();

    for (const preset of ENTITY_CATALOG) {
      const hasMatch = preset.keywords.some((kw) => normalized.includes(kw));
      if (hasMatch && !seenSlugs.has(preset.entity.slug)) {
        seenSlugs.add(preset.entity.slug);
        matchedEntities.push(structuredClone(preset.entity));
      }
    }

    // Garante pelo menos 2 módulos úteis se a descrição for muito genérica
    if (matchedEntities.length === 0) {
      matchedEntities.push(structuredClone(ENTITY_CATALOG[0].entity));
      matchedEntities.push(structuredClone(ENTITY_CATALOG[9].entity));
      matchedEntities.push(structuredClone(ENTITY_CATALOG[5].entity));
    } else if (matchedEntities.length === 1) {
      const fallback = matchedEntities[0].slug === 'clientes' ? ENTITY_CATALOG[2].entity : ENTITY_CATALOG[0].entity;
      if (!seenSlugs.has(fallback.slug)) {
        matchedEntities.push(structuredClone(fallback));
      }
    }

    // Personaliza rótulo caso o usuário tenha especificado clínica, barbearia, escola, etc.
    this.contextualizeEntities(normalized, matchedEntities);

    const appName = input.projectName.trim() || this.inferAppName(input.prompt);
    const appSlug = slugify(appName);

    const blueprint: AppBlueprint = {
      appName,
      slug: appSlug,
      tagline: `Sistema sob medida para gerenciar ${matchedEntities.map((e) => e.pluralLabel.toLowerCase()).slice(0, 3).join(', ')}`,
      summary: `Aplicação web completa gerada automaticamente a partir da descrição: "${input.prompt.slice(0, 260)}". Inclui telas responsivas com busca, paginação, cadastros validados e controle de acesso por perfis.`,
      targetAudience: input.targetAudience?.trim() || 'Empreendedores e equipes sem conhecimento técnico',
      primaryColor: '#1B4332',
      roles: [
        {
          key: 'ADMIN',
          label: 'Administrador',
          description: 'Acesso total ao sistema, relatórios, usuários e exclusão de registros.',
        },
        {
          key: 'BUILDER',
          label: 'Operador / Equipe',
          description: 'Pode cadastrar, editar, buscar e atualizar movimentações do dia a dia.',
        },
        {
          key: 'VIEWER',
          label: 'Consulta',
          description: 'Visualiza listas e status sem alterar dados existentes.',
        },
      ],
      entities: matchedEntities.slice(0, 8),
      workflows: [
        {
          name: 'Validação Automática de Cadastros',
          trigger: `Ao salvar um novo registro em ${matchedEntities[0].pluralLabel}`,
          action: 'Valida campos obrigatórios no formulário e no servidor antes de gravar no banco PostgreSQL.',
        },
        {
          name: 'Auditoria e Proteção contra Exclusão Acidental',
          trigger: 'Ao solicitar remoção de qualquer registro',
          action: 'Exibe janela de confirmação ao usuário e realiza exclusão lógica (soft delete) preservando histórico.',
        },
      ],
    };

    return AppBlueprintSchema.parse(blueprint);
  }

  private contextualizeEntities(normalizedPrompt: string, entities: BlueprintEntity[]): void {
    const cliente = entities.find((e) => e.slug === 'clientes');
    if (cliente) {
      if (normalizedPrompt.includes('paciente') || normalizedPrompt.includes('clinica')) {
        cliente.name = 'Paciente';
        cliente.slug = 'pacientes';
        cliente.label = 'Paciente';
        cliente.pluralLabel = 'Pacientes';
      } else if (normalizedPrompt.includes('aluno') || normalizedPrompt.includes('escola') || normalizedPrompt.includes('curso')) {
        cliente.name = 'Aluno';
        cliente.slug = 'alunos';
        cliente.label = 'Aluno';
        cliente.pluralLabel = 'Alunos';
      } else if (normalizedPrompt.includes('pet') || normalizedPrompt.includes('veterinari')) {
        cliente.name = 'Tutor';
        cliente.slug = 'tutores';
        cliente.label = 'Tutor';
        cliente.pluralLabel = 'Tutores';
      }
    }

    const item = entities.find((e) => e.slug === 'itens-atendidos');
    if (item) {
      if (normalizedPrompt.includes('pet') || normalizedPrompt.includes('veterinari')) {
        item.name = 'Pet';
        item.slug = 'pets';
        item.label = 'Pet';
        item.pluralLabel = 'Pets';
      } else if (normalizedPrompt.includes('veiculo') || normalizedPrompt.includes('carro') || normalizedPrompt.includes('oficina')) {
        item.name = 'Veiculo';
        item.slug = 'veiculos';
        item.label = 'Veículo';
        item.pluralLabel = 'Veículos';
      } else if (normalizedPrompt.includes('imovel') || normalizedPrompt.includes('aluguel')) {
        item.name = 'Imovel';
        item.slug = 'imoveis';
        item.label = 'Imóvel';
        item.pluralLabel = 'Imóveis';
      }
    }
  }

  private inferAppName(prompt: string): string {
    const clean = prompt.trim().slice(0, 48);
    if (clean.length < 4) return 'Meu Sistema';
    return `Sistema ${toPascalCase(clean.split(' ').slice(0, 3).join(' '))}`;
  }
}

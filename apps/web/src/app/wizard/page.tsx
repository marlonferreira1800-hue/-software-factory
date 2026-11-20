'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Loader2,
  Scissors,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AiProviderResponse,
  AppTemplateResponse,
  CreateProjectSchema,
} from '@software-factory/shared';
import { aiProvidersService } from '@/services/ai-providers.service';
import { generatorService } from '@/services/generator.service';
import { projectsService } from '@/services/projects.service';
import { templatesService } from '@/services/templates.service';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';

const BUSINESS_STARTERS = [
  {
    id: 'barbearia',
    title: 'Barbearia & Salão',
    modules: 'Clientes · Serviços · Horários',
    icon: Scissors,
    name: 'Agenda da Barbearia',
    idea: 'Quero cadastrar clientes, serviços com preço e controlar os agendamentos da minha barbearia.',
    audience: 'Barbeiros e recepção',
  },
  {
    id: 'loja',
    title: 'Loja & Estoque',
    modules: 'Produtos · Estoque · Vendas',
    icon: ShoppingBag,
    name: 'Controle da Minha Loja',
    idea: 'Preciso controlar produtos em estoque, fornecedores e registrar pedidos de vendas.',
    audience: 'Lojistas e vendedores',
  },
  {
    id: 'clinica',
    title: 'Clínica & Consultório',
    modules: 'Pacientes · Consultas · Agenda',
    icon: HeartPulse,
    name: 'Gestão da Clínica',
    idea: 'Quero organizar fichas de pacientes, profissionais e consultas marcadas da semana.',
    audience: 'Consultórios e clínicas',
  },
  {
    id: 'financeiro',
    title: 'Caixa & Finanças',
    modules: 'Entradas · Contas · Categorias',
    icon: Wallet,
    name: 'Caixa do Negócio',
    idea: 'Preciso registrar receitas, despesas, categorias e contas pagas ou a vencer.',
    audience: 'Autônomos e MEIs',
  },
  {
    id: 'servicos',
    title: 'Oficina & Serviços',
    modules: 'Clientes · Veículos · Ordens',
    icon: Briefcase,
    name: 'Controle de Atendimentos',
    idea: 'Quero cadastrar clientes, veículos atendidos, tarefas e lançamentos financeiros.',
    audience: 'Oficinas e prestadores',
  },
  {
    id: 'delivery',
    title: 'Pedidos & Delivery',
    modules: 'Clientes · Produtos · Entregas',
    icon: UtensilsCrossed,
    name: 'Pedidos & Entregas',
    idea: 'Quero cadastrar produtos, clientes e acompanhar o status dos pedidos de entrega.',
    audience: 'Restaurantes e confeitarias',
  },
];

function NewSystemFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIdea = searchParams.get('idea') || '';

  const [selectedStarterId, setSelectedStarterId] = useState<string>('');
  const [name, setName] = useState('');
  const [plainIdea, setPlainIdea] = useState(initialIdea);
  const [targetAudience, setTargetAudience] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [templates, setTemplates] = useState<AppTemplateResponse[]>([]);
  const [providers, setProviders] = useState<AiProviderResponse[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      templatesService.list({ page: 1, pageSize: 20 }),
      aiProvidersService.list({ page: 1, pageSize: 20 }),
    ])
      .then(([tplRes, provRes]) => {
        setTemplates(tplRes.data);
        setProviders(provRes.data);
        const offlineOrDefault =
          provRes.data.find((p) => p.authMode === 'NONE') ||
          provRes.data.find((p) => p.isDefault);
        if (offlineOrDefault) setSelectedProviderId(offlineOrDefault.id);
      })
      .catch(() => {});
  }, []);

  function pickStarter(starter: (typeof BUSINESS_STARTERS)[number]) {
    setSelectedStarterId(starter.id);
    setName(starter.name);
    setPlainIdea(starter.idea);
    setTargetAudience(starter.audience);
    setSelectedTemplateId('');
  }

  async function buildAndOpen(customArgs?: {
    appName: string;
    idea: string;
    audience?: string;
    templateId?: string;
  }) {
    const finalIdea = (customArgs?.idea ?? plainIdea).trim();
    const inferredName =
      (customArgs?.appName ?? name).trim() ||
      (finalIdea.length >= 6 ? `Sistema ${finalIdea.split(/\s+/).slice(0, 3).join(' ')}` : '');

    const parsed = CreateProjectSchema.safeParse({
      name: inferredName,
      plainIdea: finalIdea,
      targetAudience: (customArgs?.audience ?? targetAudience) || undefined,
      templateId: (customArgs?.templateId ?? selectedTemplateId) || undefined,
      aiProviderId: selectedProviderId || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Descreva o que você precisa controlar.');
      return;
    }

    setCreating(true);
    try {
      const created = await projectsService.create(parsed.data);

      const selectedProv = providers.find((p) => p.id === selectedProviderId);
      if (!created.blueprintJson) {
        await generatorService.generateBlueprint(created.id, {
          prompt: finalIdea,
          providerId:
            selectedProv && selectedProv.authMode !== 'BROWSER_HANDOFF'
              ? selectedProv.id
              : undefined,
        });
      }

      await generatorService.generateCode(created.id, {
        includeDocker: true,
        includeAiPack: true,
      });

      toast.success('Sistema criado e pronto para testar!');
      router.push(`/studio?id=${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar o sistema.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
          Criação Automática
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          O que você quer organizar hoje?
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Escolha um ramo abaixo ou escreva em uma frase. Em um clique nós montamos todas as telas e deixamos pronto para você testar.
        </p>
      </div>

      {/* Quick Business Starters */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          1. Escolha um modelo de negócio (ou pule para escrever abaixo)
        </Label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_STARTERS.map((item) => {
            const Icon = item.icon;
            const selected = selectedStarterId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => pickStarter(item)}
                className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                  selected
                    ? 'border-foreground bg-card ring-1 ring-foreground'
                    : 'border-border bg-card hover:border-stone-400'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-sm text-foreground">{item.title}</p>
                    {selected && <Check className="h-4 w-4 text-accent shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.modules}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 1-Click Creation Card */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void buildAndOpen();
        }}
        className="rounded-xl border border-border bg-card p-6 space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="wiz-idea" className="text-sm font-semibold">
            2. Descreva o que o seu sistema precisa controlar
          </Label>
          <Textarea
            id="wiz-idea"
            className="min-h-[110px] text-[15px]"
            placeholder="Ex: Quero cadastrar clientes com WhatsApp, controlar meus serviços com preço e gerenciar horários marcados na semana."
            value={plainIdea}
            onChange={(e) => setPlainIdea(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="wiz-name">Nome do sistema (opcional)</Label>
            <Input
              id="wiz-name"
              placeholder="Ex: Agenda da Padaria Pão Quente"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wiz-audience">Quem vai usar no dia a dia? (opcional)</Label>
            <Input
              id="wiz-audience"
              placeholder="Ex: Eu e 2 atendentes"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>
        </div>

        {/* Progressive Disclosure for Advanced Options */}
        <div className="border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Opções avançadas (modelo pronto da comunidade ou conector externo)
          </button>

          {showAdvanced && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 rounded-lg bg-muted/60 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="wiz-tpl">Clonar modelo salvo</Label>
                <select
                  id="wiz-tpl"
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedTemplateId(id);
                    const tpl = templates.find((t) => t.id === id);
                    if (tpl) {
                      setName(tpl.blueprintJson.appName);
                      setPlainIdea(tpl.plainPromptExample);
                      setTargetAudience(tpl.targetAudience);
                    }
                  }}
                >
                  <option value="">Gerar automaticamente do texto</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wiz-prov">Motor / Conector</Label>
                <select
                  id="wiz-prov"
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Cria telas, cadastros, simulador ao vivo e pacote para download automático.
          </p>
          <Button type="submit" variant="accent" size="lg" disabled={creating} className="min-w-[230px]">
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Montando seu sistema...
              </>
            ) : (
              <>
                Montar e Abrir Meu Sistema
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function WizardPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Preparando criador...</div>}>
        <NewSystemFormContent />
      </Suspense>
    </AppShell>
  );
}

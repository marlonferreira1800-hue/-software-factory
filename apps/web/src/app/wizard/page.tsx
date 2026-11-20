'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AiProviderResponse,
  AppBlueprint,
  AppTemplateResponse,
  CreateProjectSchema,
  SoftwareProjectResponse,
} from '@software-factory/shared';
import { aiProvidersService } from '@/services/ai-providers.service';
import { generatorService } from '@/services/generator.service';
import { projectsService } from '@/services/projects.service';
import { templatesService } from '@/services/templates.service';
import { AppShell } from '@/components/layout/app-shell';
import { BlueprintVisualEditor } from '@/components/projects/blueprint-visual-editor';
import { SubscriptionBridgePanel } from '@/components/projects/subscription-bridge-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';

const EXAMPLE_IDEAS = [
  {
    name: 'Barbearia & Agenda do Bairro',
    idea: 'Quero cadastrar clientes, serviços com preço e controlar os agendamentos da minha barbearia.',
    audience: 'Barbeiros e recepção',
  },
  {
    name: 'Loja de Roupas & Estoque',
    idea: 'Preciso controlar produtos em estoque, fornecedores e registrar pedidos de vendas.',
    audience: 'Lojistas e vendedores',
  },
  {
    name: 'Clínica de Atendimento',
    idea: 'Quero organizar fichas de pacientes, profissionais e consultas marcadas da semana.',
    audience: 'Consultórios e clínicas',
  },
  {
    name: 'Caixa do Autônomo',
    idea: 'Preciso registrar receitas, despesas, categorias e contas pagas ou a vencer.',
    audience: 'MEIs e prestadores de serviço',
  },
];

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [plainIdea, setPlainIdea] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');

  const [templates, setTemplates] = useState<AppTemplateResponse[]>([]);
  const [providers, setProviders] = useState<AiProviderResponse[]>([]);
  const [project, setProject] = useState<SoftwareProjectResponse | null>(null);
  const [blueprint, setBlueprint] = useState<AppBlueprint | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      templatesService.list({ page: 1, pageSize: 20 }),
      aiProvidersService.list({ page: 1, pageSize: 20 }),
    ])
      .then(([tplRes, provRes]) => {
        setTemplates(tplRes.data);
        setProviders(provRes.data);
        const def = provRes.data.find((p) => p.isDefault) || provRes.data[0];
        if (def) setSelectedProviderId(def.id);
      })
      .catch(() => {
        toast.error('Erro ao carregar modelos e conectores.');
      });
  }, []);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId) || null;

  async function handleStep1Next() {
    const parsed = CreateProjectSchema.safeParse({
      name,
      plainIdea,
      targetAudience: targetAudience || undefined,
      templateId: selectedTemplateId || undefined,
      aiProviderId: selectedProviderId || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Preencha nome e descrição da ideia.');
      return;
    }

    setBusy(true);
    try {
      const created = await projectsService.create(parsed.data);
      setProject(created);

      if (created.blueprintJson) {
        setBlueprint(created.blueprintJson);
        setStep(3);
        toast.success('Modelo pronto carregado! Revise as telas abaixo.');
      } else {
        setStep(2);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar projeto.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRunSelectedEngine() {
    if (!project) return;
    setBusy(true);
    try {
      const res = await generatorService.generateBlueprint(project.id, {
        prompt: plainIdea,
        providerId: selectedProviderId || undefined,
      });
      setProject(res.project);
      setBlueprint(res.blueprint);
      setStep(3);
      toast.success('Estrutura do seu sistema desenhada com sucesso!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao gerar estrutura.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveBlueprint(next: AppBlueprint) {
    if (!project) return;
    setBusy(true);
    try {
      const updated = await projectsService.update(project.id, { blueprintJson: next });
      setProject(updated);
      setBlueprint(next);
      toast.success('Estrutura atualizada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar alterações.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCompileAndOpenStudio() {
    if (!project) return;
    setBusy(true);
    try {
      await generatorService.generateCode(project.id, {
        includeDocker: true,
        includeAiPack: true,
      });
      toast.success('Software completo gerado! Abrindo simulador e downloads...');
      router.push(`/projects/${project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao compilar o código.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Assistente Guiado — Construa seu Software
            </h1>
            <p className="text-sm text-muted-foreground">
              Responda em linguagem natural. Nós criamos banco de dados, servidor seguro e telas prontas.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <Badge variant={step === 1 ? 'default' : 'success'}>1. Sua Ideia</Badge>
            <span>→</span>
            <Badge variant={step === 2 ? 'default' : step > 2 ? 'success' : 'outline'}>
              2. Inteligência
            </Badge>
            <span>→</span>
            <Badge variant={step === 3 ? 'default' : 'outline'}>3. Revisar & Gerar</Badge>
          </div>
        </div>

        {step === 1 && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Passo 1: O que você deseja construir?</CardTitle>
                <CardDescription>
                  Escreva como se estivesse explicando para um amigo, ou escolha um exemplo ao lado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wiz-name">Nome do seu sistema ou negócio</Label>
                  <Input
                    id="wiz-name"
                    placeholder="Ex: Sistema da Padaria Pão Quente"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="wiz-idea">Explique o que o sistema precisa controlar</Label>
                  <Textarea
                    id="wiz-idea"
                    className="min-h-[120px]"
                    placeholder="Ex: Quero cadastrar clientes com WhatsApp, controlar meus produtos e registrar encomendas para entrega."
                    value={plainIdea}
                    onChange={(e) => setPlainIdea(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-audience">Quem vai usar? (opcional)</Label>
                    <Input
                      id="wiz-audience"
                      placeholder="Ex: Eu e minha equipe"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wiz-tpl">Usar um modelo pronto? (opcional)</Label>
                    <select
                      id="wiz-tpl"
                      className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                      value={selectedTemplateId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedTemplateId(id);
                        const tpl = templates.find((t) => t.id === id);
                        if (tpl && !plainIdea) {
                          setName(tpl.blueprintJson.appName);
                          setPlainIdea(tpl.plainPromptExample);
                          setTargetAudience(tpl.targetAudience);
                        }
                      }}
                    >
                      <option value="">Não, gerar a partir do meu texto</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleStep1Next} disabled={busy} size="lg">
                    {busy ? 'Preparando...' : 'Continuar'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/40">
              <CardHeader>
                <CardTitle className="text-base">Sem inspiração? Clique em um exemplo</CardTitle>
                <CardDescription>Preenche automaticamente para você testar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {EXAMPLE_IDEAS.map((ex) => (
                  <button
                    key={ex.name}
                    type="button"
                    onClick={() => {
                      setName(ex.name);
                      setPlainIdea(ex.idea);
                      setTargetAudience(ex.audience);
                      setSelectedTemplateId('');
                    }}
                    className="w-full rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary cursor-pointer"
                  >
                    <p className="font-semibold text-sm text-foreground">{ex.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ex.idea}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && project && (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Passo 2: Escolha qual cérebro vai desenhar seu sistema
                </CardTitle>
                <CardDescription>
                  Você pode gerar na hora com o Motor Offline gratuito ou usar sua assinatura do Antigravity, ChatGPT, Claude ou Gemini.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {providers.map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setSelectedProviderId(prov.id)}
                      className={`rounded-xl border p-4 text-left transition cursor-pointer ${
                        selectedProviderId === prov.id
                          ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                          : 'border-border bg-white hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm">{prov.subscriptionBrand}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {prov.authMode === 'NONE'
                            ? 'Instantâneo'
                            : prov.authMode === 'BROWSER_HANDOFF'
                              ? 'Assinatura Web'
                              : prov.authMode === 'LOCAL_CLI'
                                ? 'CLI Local'
                                : 'API / Local'}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-foreground mt-1">{prov.name}</p>
                      {prov.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {prov.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>

                {selectedProvider?.authMode !== 'BROWSER_HANDOFF' && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="h-4 w-4" />
                      Voltar
                    </Button>
                    <Button size="lg" onClick={handleRunSelectedEngine} disabled={busy}>
                      <Wand2 className="h-4 w-4" />
                      {busy ? 'Desenhando telas e banco...' : 'Gerar Telas Automaticamente'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedProvider?.authMode === 'BROWSER_HANDOFF' && (
              <SubscriptionBridgePanel
                projectId={project.id}
                initialPrompt={plainIdea}
                onImported={(importedBlueprint) => {
                  setBlueprint(importedBlueprint);
                  setStep(3);
                }}
              />
            )}
          </div>
        )}

        {step === 3 && project && blueprint && (
          <div className="space-y-5">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h2 className="font-display font-semibold text-base">
                      Estrutura pronta! Confira ou personalize antes de gerar o código
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Adicione ou renomeie campos em português e depois clique em &ldquo;Construir Software Completo&rdquo;.
                    </p>
                  </div>
                </div>
                <Button size="lg" onClick={handleCompileAndOpenStudio} disabled={busy}>
                  <Code2 className="h-4 w-4" />
                  {busy ? 'Construindo arquivos...' : 'Construir Software Completo'}
                  <Sparkles className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <BlueprintVisualEditor
              blueprint={blueprint}
              onSave={handleSaveBlueprint}
              saving={busy}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

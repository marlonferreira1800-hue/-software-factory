'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Bot,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AiProviderAuthMode,
  AiProviderResponse,
  AiProviderType,
  CreateAiProviderSchema,
  PaginatedMeta,
} from '@software-factory/shared';
import { useAuth } from '@/lib/auth-context';
import { aiProvidersService } from '@/services/ai-providers.service';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { PaginationBar } from '@/components/common/pagination-bar';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Label, Skeleton, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/tabs';

const PROVIDER_PRESETS: Array<{
  label: string;
  providerType: AiProviderType;
  authMode: AiProviderAuthMode;
  subscriptionBrand: string;
  baseUrl?: string;
  modelName?: string;
  cliCommand?: string;
  description: string;
}> = [
  {
    label: 'Antigravity (Ponte de Assinatura)',
    providerType: 'ANTIGRAVITY_AGENT',
    authMode: 'BROWSER_HANDOFF',
    subscriptionBrand: 'Antigravity',
    modelName: 'antigravity-workspace',
    description: 'Usa sua conta Antigravity via super-prompts e pacotes AGENTS.md.',
  },
  {
    label: 'ChatGPT (Assinatura Web Plus/Pro)',
    providerType: 'SUBSCRIPTION_BRIDGE',
    authMode: 'BROWSER_HANDOFF',
    subscriptionBrand: 'ChatGPT',
    baseUrl: 'https://chatgpt.com',
    description: 'Use sua assinatura no navegador sem pagar chave API extra.',
  },
  {
    label: 'Claude (Assinatura Web Pro/Max)',
    providerType: 'SUBSCRIPTION_BRIDGE',
    authMode: 'BROWSER_HANDOFF',
    subscriptionBrand: 'Claude',
    baseUrl: 'https://claude.ai',
    description: 'Use sua assinatura Claude.ai com ponte assistida.',
  },
  {
    label: 'Gemini (Assinatura Web Google AI)',
    providerType: 'SUBSCRIPTION_BRIDGE',
    authMode: 'BROWSER_HANDOFF',
    subscriptionBrand: 'Gemini',
    baseUrl: 'https://gemini.google.com',
    description: 'Use sua assinatura Google Gemini no navegador.',
  },
  {
    label: 'Claude Code CLI (Assinatura Local)',
    providerType: 'CLAUDE_CLI',
    authMode: 'LOCAL_CLI',
    subscriptionBrand: 'Claude Code',
    cliCommand: 'claude',
    description: 'Executa o CLI oficial `claude` autenticado localmente.',
  },
  {
    label: 'Gemini CLI (Assinatura Local)',
    providerType: 'GEMINI_CLI',
    authMode: 'LOCAL_CLI',
    subscriptionBrand: 'Gemini CLI',
    cliCommand: 'gemini',
    description: 'Executa o CLI oficial `gemini` autenticado localmente.',
  },
  {
    label: 'OpenAI Codex CLI (Assinatura ChatGPT Local)',
    providerType: 'CODEX_CLI',
    authMode: 'LOCAL_CLI',
    subscriptionBrand: 'Codex CLI',
    cliCommand: 'codex',
    description: 'Executa o CLI oficial `codex` autenticado com sua conta ChatGPT.',
  },
  {
    label: 'Ollama Local (Gratuito no seu PC)',
    providerType: 'OLLAMA_LOCAL',
    authMode: 'LOCAL_SERVER',
    subscriptionBrand: 'Ollama',
    baseUrl: 'http://localhost:11434',
    modelName: 'llama3.1',
    description: 'Modelos open-source rodando direto na sua máquina.',
  },
  {
    label: 'OpenAI API (Chave API)',
    providerType: 'OPENAI_API',
    authMode: 'API_KEY',
    subscriptionBrand: 'OpenAI API',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o-mini',
    description: 'Integração direta via API Key da OpenAI.',
  },
  {
    label: 'Anthropic API (Chave API)',
    providerType: 'ANTHROPIC_API',
    authMode: 'API_KEY',
    subscriptionBrand: 'Anthropic API',
    modelName: 'claude-3-7-sonnet-latest',
    description: 'Integração direta via API Key da Anthropic.',
  },
  {
    label: 'Google Gemini API (Chave API)',
    providerType: 'GEMINI_API',
    authMode: 'API_KEY',
    subscriptionBrand: 'Gemini API',
    modelName: 'gemini-2.5-flash',
    description: 'Integração direta via API Key do Google AI Studio.',
  },
];

export default function AiConnectorsPage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'BUILDER');

  const [items, setItems] = useState<AiProviderResponse[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({
    page: 1,
    pageSize: 9,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [search, setSearch] = useState('');
  const [authFilter, setAuthFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AiProviderResponse | null>(null);
  const [deletingItem, setDeletingItem] = useState<AiProviderResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState<AiProviderType>('SUBSCRIPTION_BRIDGE');
  const [authMode, setAuthMode] = useState<AiProviderAuthMode>('BROWSER_HANDOFF');
  const [subscriptionBrand, setSubscriptionBrand] = useState('ChatGPT');
  const [description, setDescription] = useState('');
  const [modelName, setModelName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [cliCommand, setCliCommand] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiProvidersService.list({
        page,
        pageSize: 9,
        search: search || undefined,
        authMode: (authFilter as AiProviderAuthMode) || undefined,
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao listar conectores.');
    } finally {
      setLoading(false);
    }
  }, [page, search, authFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  function openNewModal() {
    setEditing(null);
    applyPreset(PROVIDER_PRESETS[0]);
    setApiKey('');
    setIsDefault(false);
    setModalOpen(true);
  }

  function openEditModal(item: AiProviderResponse) {
    setEditing(item);
    setName(item.name);
    setProviderType(item.providerType);
    setAuthMode(item.authMode);
    setSubscriptionBrand(item.subscriptionBrand);
    setDescription(item.description || '');
    setModelName(item.modelName || '');
    setBaseUrl(item.baseUrl || '');
    setCliCommand(item.cliCommand || '');
    setApiKey('');
    setIsDefault(item.isDefault);
    setModalOpen(true);
  }

  function applyPreset(preset: (typeof PROVIDER_PRESETS)[number]) {
    setName(preset.label);
    setProviderType(preset.providerType);
    setAuthMode(preset.authMode);
    setSubscriptionBrand(preset.subscriptionBrand);
    setDescription(preset.description);
    setModelName(preset.modelName || '');
    setBaseUrl(preset.baseUrl || '');
    setCliCommand(preset.cliCommand || '');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = CreateAiProviderSchema.safeParse({
      name,
      providerType,
      authMode,
      subscriptionBrand,
      description: description || undefined,
      modelName: modelName || undefined,
      baseUrl: baseUrl || undefined,
      cliCommand: cliCommand || undefined,
      apiKey: apiKey || undefined,
      isDefault,
      isActive: true,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Verifique os campos preenchidos.');
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await aiProvidersService.update(editing.id, parsed.data);
        toast.success('Conector atualizado!');
      } else {
        await aiProvidersService.create(parsed.data);
        toast.success('Conector de IA adicionado!');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar conector.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTest(item: AiProviderResponse) {
    setTestingId(item.id);
    try {
      const res = await aiProvidersService.testConnection(item.id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.warning(`${res.message}${res.details ? ` — ${res.details}` : ''}`);
      }
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao testar conector.');
    } finally {
      setTestingId(null);
    }
  }

  async function confirmDelete() {
    if (!deletingItem) return;
    setSubmitting(true);
    try {
      await aiProvidersService.remove(deletingItem.id);
      toast.success('Conector removido.');
      setDeletingItem(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Integrações & Assinaturas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Opcional: conecte Antigravity, ChatGPT, Claude, Gemini ou Ollama para refinar projetos maiores.
            </p>
          </div>
          {canWrite && (
            <Button variant="accent" onClick={openNewModal}>
              <Plus className="h-4 w-4" />
              Nova Integração
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por Antigravity, ChatGPT, Claude, Gemini..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <select
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm"
            value={authFilter}
            onChange={(e) => {
              setPage(1);
              setAuthFilter(e.target.value);
            }}
          >
            <option value="">Todos os modos</option>
            <option value="NONE">Offline / Zero Config</option>
            <option value="BROWSER_HANDOFF">Assinatura Web (Ponte)</option>
            <option value="LOCAL_CLI">CLI de Assinatura Local</option>
            <option value="LOCAL_SERVER">Servidor Local (Ollama)</option>
            <option value="API_KEY">Chave de API</option>
          </select>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent className="space-y-2">
              <p className="font-display text-lg font-semibold">Nenhum conector encontrado</p>
              <p className="text-sm text-muted-foreground">
                Adicione sua assinatura Antigravity, ChatGPT, Claude ou Gemini acima.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary shrink-0" />
                      <Badge variant="outline">{item.subscriptionBrand}</Badge>
                    </div>
                    {item.isDefault && <Badge variant="success">Padrão</Badge>}
                  </div>
                  <CardTitle className="pt-2 text-base">{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Modo: <strong className="text-foreground">{item.authMode}</strong>
                    </p>
                    {item.maskedApiKey && (
                      <p>
                        Chave: <code className="font-mono">{item.maskedApiKey}</code>
                      </p>
                    )}
                    {item.lastTestStatus && (
                      <p className="line-clamp-2 text-stone-700">{item.lastTestStatus}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    {canWrite ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={testingId === item.id}
                        onClick={() => handleTest(item)}
                      >
                        <Activity className="h-3.5 w-3.5" />
                        {testingId === item.id ? 'Testando...' : 'Testar Conexão'}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Somente leitura</span>
                    )}

                    {canWrite && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEditModal(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingItem(item)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <PaginationBar meta={meta} onPageChange={setPage} />
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Conector de IA' : 'Novo Conector de IA / Assinatura'}
            </DialogTitle>
            <DialogDescription>
              Escolha um modelo pronto abaixo para configurar Antigravity, ChatGPT, Claude, Gemini ou Ollama.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5">
            {!editing && (
              <div className="space-y-1">
                <Label>Modelo Rápido de Configuração</Label>
                <select
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  onChange={(e) => {
                    const found = PROVIDER_PRESETS.find((p) => p.label === e.target.value);
                    if (found) applyPreset(found);
                  }}
                >
                  {PROVIDER_PRESETS.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Nome do Conector</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Plataforma / Marca</Label>
                <Input
                  value={subscriptionBrand}
                  onChange={(e) => setSubscriptionBrand(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Descrição amigável</Label>
              <Textarea
                className="min-h-[68px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {(authMode === 'API_KEY' || authMode === 'LOCAL_SERVER') && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>URL Base (opcional)</Label>
                  <Input
                    placeholder="http://localhost:11434"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nome do Modelo</Label>
                  <Input
                    placeholder="gpt-4o-mini / llama3.1"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {authMode === 'API_KEY' && (
              <div className="space-y-1">
                <Label>Chave API (criptografada com AES-256 no servidor)</Label>
                <Input
                  type="password"
                  placeholder={editing?.hasApiKey ? 'Deixe vazio para manter a chave atual' : 'Cole sua chave API'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Usar como conector padrão</span>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar Conector'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
        title={`Remover "${deletingItem?.name}"?`}
        description="Este conector deixará de aparecer na criação de novos projetos."
        loading={submitting}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}

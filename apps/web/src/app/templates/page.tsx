'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutTemplate, Pencil, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AppTemplateResponse,
  CreateTemplateSchema,
  PaginatedMeta,
  TemplateCategory,
} from '@software-factory/shared';
import { useAuth } from '@/lib/auth-context';
import { projectsService } from '@/services/projects.service';
import { templatesService } from '@/services/templates.service';
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

const CATEGORIES: TemplateCategory[] = [
  'SERVICOS',
  'COMERCIO',
  'SAUDE',
  'FINANCAS',
  'EDUCACAO',
  'OPERACOES',
  'OUTROS',
];

export default function TemplatesPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const canWrite = hasRole('ADMIN', 'BUILDER');

  const [templates, setTemplates] = useState<AppTemplateResponse[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({
    page: 1,
    pageSize: 9,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [usingTemplateId, setUsingTemplateId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppTemplateResponse | null>(null);
  const [deletingItem, setDeletingItem] = useState<AppTemplateResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('SERVICOS');
  const [shortDescription, setShortDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [plainPromptExample, setPlainPromptExample] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await templatesService.list({
        page,
        pageSize: 9,
        search: search || undefined,
        category: (categoryFilter as TemplateCategory) || undefined,
      });
      setTemplates(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao listar modelos.');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  async function handleUseTemplate(tpl: AppTemplateResponse) {
    setUsingTemplateId(tpl.id);
    try {
      const project = await projectsService.create({
        name: `${tpl.blueprintJson.appName} (${new Date().toLocaleDateString('pt-BR')})`,
        plainIdea: tpl.plainPromptExample,
        targetAudience: tpl.targetAudience,
        templateId: tpl.id,
      });
      toast.success('Projeto criado a partir do modelo!');
      router.push(`/projects/${project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível clonar o modelo.');
    } finally {
      setUsingTemplateId(null);
    }
  }

  function openCreate() {
    setEditing(null);
    setName('');
    setCategory('SERVICOS');
    setShortDescription('');
    setTargetAudience('');
    setPlainPromptExample('');
    setModalOpen(true);
  }

  function openEdit(tpl: AppTemplateResponse) {
    setEditing(tpl);
    setName(tpl.name);
    setCategory(tpl.category);
    setShortDescription(tpl.shortDescription);
    setTargetAudience(tpl.targetAudience);
    setPlainPromptExample(tpl.plainPromptExample);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const baseBlueprint = editing?.blueprintJson || {
      appName: name || 'Novo Sistema',
      slug: 'novo-sistema',
      tagline: shortDescription || 'Sistema personalizado',
      summary: plainPromptExample || 'Sistema criado a partir de modelo da comunidade.',
      targetAudience: targetAudience || 'Pequenos negócios',
      primaryColor: '#1B4332',
      roles: [
        { key: 'ADMIN', label: 'Administrador', description: 'Acesso completo' },
      ],
      entities: [
        {
          name: 'Registro',
          slug: 'registros',
          label: 'Registro',
          pluralLabel: 'Registros',
          description: 'Cadastro principal do módulo.',
          icon: 'FolderKanban',
          softDelete: true,
          readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
          writeRoles: ['ADMIN', 'BUILDER'],
          fields: [
            {
              name: 'titulo',
              label: 'Título',
              type: 'string',
              required: true,
              unique: false,
              searchable: true,
              showInTable: true,
            },
          ],
        },
      ],
      workflows: [],
    };

    const parsed = CreateTemplateSchema.safeParse({
      name,
      category,
      icon: 'LayoutGrid',
      shortDescription,
      targetAudience,
      plainPromptExample,
      blueprintJson: baseBlueprint,
      isOfficial: editing?.isOfficial || false,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'Revise os campos do modelo.');
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await templatesService.update(editing.id, parsed.data);
        toast.success('Modelo atualizado!');
      } else {
        await templatesService.create(parsed.data);
        toast.success('Modelo criado!');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar modelo.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deletingItem) return;
    setSubmitting(true);
    try {
      await templatesService.remove(deletingItem.id);
      toast.success('Modelo removido.');
      setDeletingItem(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir modelo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Modelos Prontos</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um sistema pronto para começar em 1 clique e depois personalize tudo como quiser.
            </p>
          </div>
          {canWrite && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Publicar Novo Modelo
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar modelo (ex: Barbearia, Loja, Clínica, Finanças...)"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <select
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm"
            value={categoryFilter}
            onChange={(e) => {
              setPage(1);
              setCategoryFilter(e.target.value);
            }}
          >
            <option value="">Todas as categorias</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <p className="font-display text-lg font-semibold">Nenhum modelo encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((tpl) => {
              const canEditThis =
                hasRole('ADMIN') || (hasRole('BUILDER') && tpl.authorId === user?.id);
              return (
                <Card key={tpl.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{tpl.category}</Badge>
                      {tpl.isOfficial && <Badge variant="success">Oficial</Badge>}
                    </div>
                    <CardTitle className="pt-2 flex items-center gap-2 text-base">
                      <LayoutTemplate className="h-4 w-4 text-primary shrink-0" />
                      {tpl.name}
                    </CardTitle>
                    <CardDescription>{tpl.shortDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        Indicado para: <strong className="text-foreground">{tpl.targetAudience}</strong>
                      </p>
                      <p>{tpl.blueprintJson.entities.length} telas incluídas · {tpl.usageCount} usos</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      {canWrite ? (
                        <Button
                          size="sm"
                          disabled={usingTemplateId === tpl.id}
                          onClick={() => handleUseTemplate(tpl)}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {usingTemplateId === tpl.id ? 'Criando...' : 'Usar Este Modelo'}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Modo leitura</span>
                      )}

                      {canEditThis && (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(tpl)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingItem(tpl)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <PaginationBar meta={meta} onPageChange={setPage} />
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Modelo' : 'Novo Modelo da Comunidade'}</DialogTitle>
            <DialogDescription>
              Compartilhe modelos prontos para que outras pessoas criem sistemas em 1 clique.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Nome do Modelo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <select
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descrição curta</Label>
              <Input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Público indicado</Label>
              <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Exemplo de pedido em linguagem simples</Label>
              <Textarea
                value={plainPromptExample}
                onChange={(e) => setPlainPromptExample(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar Modelo'}
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
        title={`Excluir modelo "${deletingItem?.name}"?`}
        description="Esta ação remove o modelo do catálogo público."
        loading={submitting}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}

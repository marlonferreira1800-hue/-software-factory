'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  ExternalLink,
  FolderPlus,
  Pencil,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AiProviderResponse,
  AppTemplateResponse,
  PaginatedMeta,
  ProjectStatus,
  SoftwareProjectResponse,
} from '@software-factory/shared';
import { useAuth } from '@/lib/auth-context';
import { aiProvidersService } from '@/services/ai-providers.service';
import { generatorService } from '@/services/generator.service';
import { projectsService } from '@/services/projects.service';
import { templatesService } from '@/services/templates.service';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { PaginationBar } from '@/components/common/pagination-bar';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Skeleton } from '@/components/ui/input';

const STATUS_LABEL: Record<ProjectStatus, { label: string; variant: 'outline' | 'default' | 'success' | 'warning' }> = {
  DRAFT: { label: 'Rascunho', variant: 'outline' },
  DESIGNED: { label: 'Modelado', variant: 'warning' },
  GENERATED: { label: 'Código Pronto', variant: 'success' },
  EXPORTED: { label: 'Exportado (.ZIP)', variant: 'default' },
};

export default function ProjectsPage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'BUILDER');

  const [projects, setProjects] = useState<SoftwareProjectResponse[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [templates, setTemplates] = useState<AppTemplateResponse[]>([]);
  const [providers, setProviders] = useState<AiProviderResponse[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<SoftwareProjectResponse | null>(null);
  const [deletingProject, setDeletingProject] = useState<SoftwareProjectResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsService.list({
        page,
        pageSize: 8,
        search: search || undefined,
        status: (statusFilter as ProjectStatus) || undefined,
      });
      setProjects(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao listar projetos.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadProjects();
    });
    return () => {
      active = false;
    };
  }, [loadProjects]);

  useEffect(() => {
    Promise.all([
      templatesService.list({ page: 1, pageSize: 30 }),
      aiProvidersService.list({ page: 1, pageSize: 30 }),
    ])
      .then(([t, p]) => {
        setTemplates(t.data);
        setProviders(p.data);
      })
      .catch(() => {});
  }, []);

  async function handleConfirmDelete() {
    if (!deletingProject) return;
    setDeleting(true);
    try {
      await projectsService.remove(deletingProject.id);
      toast.success(`Projeto "${deletingProject.name}" excluído.`);
      setDeletingProject(null);
      loadProjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir projeto.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Meus Projetos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus sistemas criados, simule telas, conecte IAs e baixe o código completo.
            </p>
          </div>
          {canWrite && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { setEditingProject(null); setModalOpen(true); }}>
                <FolderPlus className="h-4 w-4" />
                Cadastro Rápido
              </Button>
              <Button asChild>
                <Link href="/wizard">
                  <Sparkles className="h-4 w-4" />
                  Novo com Assistente
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome, descrição ou público-alvo..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <select
            aria-label="Filtrar por status"
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="DESIGNED">Modelado</option>
            <option value="GENERATED">Código Pronto</option>
            <option value="EXPORTED">Exportado (.ZIP)</option>
          </select>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent className="space-y-3">
              <p className="font-display text-lg font-semibold">Nenhum projeto encontrado</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {search || statusFilter
                  ? 'Tente limpar os filtros de busca para ver seus outros projetos.'
                  : 'Use o Assistente Guiado para descrever sua ideia em português e criar seu primeiro sistema.'}
              </p>
              {canWrite && (
                <Button asChild>
                  <Link href="/wizard">
                    <Sparkles className="h-4 w-4" />
                    Criar Meu Primeiro Sistema
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((proj) => {
              const badge = STATUS_LABEL[proj.status] || STATUS_LABEL.DRAFT;
              return (
                <Card key={proj.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle>{proj.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {proj.plainIdea}
                        </CardDescription>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md bg-muted px-2 py-1">
                        {proj.blueprintJson?.entities.length || 0} módulos/telas
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1">
                        {proj.generatedFilesCount} arquivos gerados
                      </span>
                      {proj.aiProvider && (
                        <span className="rounded-md bg-muted px-2 py-1">
                          IA: {proj.aiProvider.subscriptionBrand}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" asChild>
                          <Link href={`/projects/${proj.id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                            Abrir Studio
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            generatorService
                              .downloadZip(proj.id, proj.slug)
                              .then(() => toast.success('Download do .ZIP iniciado!'))
                              .catch((e) => toast.error(e.message))
                          }
                        >
                          <Download className="h-3.5 w-3.5" />
                          .ZIP
                        </Button>
                      </div>

                      {canWrite && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Editar projeto"
                            onClick={() => {
                              setEditingProject(proj);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Excluir projeto"
                            onClick={() => setDeletingProject(proj)}
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

      <ProjectFormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingProject={editingProject}
        templates={templates}
        providers={providers}
        onSaved={() => loadProjects()}
      />

      <DeleteConfirmDialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => {
          if (!open) setDeletingProject(null);
        }}
        title={`Excluir "${deletingProject?.name}"?`}
        description="O projeto será movido para a lixeira (soft delete) e não aparecerá mais na listagem."
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </AppShell>
  );
}

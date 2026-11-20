'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Check,
  Code2,
  Copy,
  Download,
  History,
  Layers,
  Play,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AppBlueprint,
  GeneratedArtifactItem,
  ProjectArtifactsBundleResponse,
  SoftwareProjectResponse,
} from '@software-factory/shared';
import { useAuth } from '@/lib/auth-context';
import { generatorService } from '@/services/generator.service';
import { projectsService } from '@/services/projects.service';
import { BlueprintVisualEditor } from '@/components/projects/blueprint-visual-editor';
import { LivePrototypePreview } from '@/components/projects/live-prototype-preview';
import { SubscriptionBridgePanel } from '@/components/projects/subscription-bridge-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LAYER_LABELS: Record<string, string> = {
  ALL: 'Todos',
  DATABASE: 'Banco de Dados',
  BACKEND: 'Backend (API)',
  FRONTEND: 'Telas (Frontend)',
  INFRA: 'Docker & Infra',
  AI_PACK: 'Pacote IA / Antigravity',
  DOCS: 'Manual',
};

export function ProjectStudioView({ projectId }: { projectId: string }) {
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'BUILDER');

  const [project, setProject] = useState<SoftwareProjectResponse | null>(null);
  const [bundle, setBundle] = useState<ProjectArtifactsBundleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);
  const [layerFilter, setLayerFilter] = useState('ALL');
  const [selectedArtifact, setSelectedArtifact] = useState<GeneratedArtifactItem | null>(null);
  const [copiedFile, setCopiedFile] = useState(false);

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [proj, art] = await Promise.all([
        projectsService.getById(projectId),
        generatorService.getArtifacts(projectId),
      ]);
      setProject(proj);
      setBundle(art);
      if (art.artifacts.length > 0) {
        setSelectedArtifact((prev) =>
          prev
            ? art.artifacts.find((a) => a.filePath === prev.filePath) || art.artifacts[0]
            : art.artifacts[0],
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar projeto.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadAll();
    });
    return () => {
      active = false;
    };
  }, [loadAll]);

  async function handleGenerateBlueprintNow() {
    if (!project) return;
    setBusyAction(true);
    try {
      await generatorService.generateBlueprint(project.id, {
        prompt: project.plainIdea,
      });
      toast.success('Estrutura desenhada automaticamente!');
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao modelar estrutura.');
    } finally {
      setBusyAction(false);
    }
  }

  async function handleSaveBlueprint(next: AppBlueprint) {
    if (!project) return;
    setBusyAction(true);
    try {
      const updated = await projectsService.update(project.id, { blueprintJson: next });
      setProject(updated);
      toast.success('Estrutura salva! Clique em "Gerar Código" para atualizar os arquivos.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar estrutura.');
    } finally {
      setBusyAction(false);
    }
  }

  async function handleGenerateCode() {
    if (!project) return;
    setBusyAction(true);
    try {
      const nextBundle = await generatorService.generateCode(project.id, {
        includeDocker: true,
        includeAiPack: true,
      });
      setBundle(nextBundle);
      if (nextBundle.artifacts[0]) setSelectedArtifact(nextBundle.artifacts[0]);
      await loadAll();
      toast.success(`Código completo compilado (${nextBundle.artifacts.length} arquivos)!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao gerar código.');
    } finally {
      setBusyAction(false);
    }
  }

  async function handleDownloadZip() {
    if (!project) return;
    setBusyAction(true);
    try {
      await generatorService.downloadZip(project.id, project.slug);
      toast.success('Pacote .ZIP baixado com sucesso!');
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao baixar .ZIP.');
    } finally {
      setBusyAction(false);
    }
  }

  async function handleCopyArtifact() {
    if (!selectedArtifact) return;
    await navigator.clipboard.writeText(selectedArtifact.content);
    setCopiedFile(true);
    toast.success(`Conteúdo de ${selectedArtifact.filePath} copiado!`);
    setTimeout(() => setCopiedFile(false), 2000);
  }

  const filteredArtifacts = (bundle?.artifacts || []).filter((a) =>
    layerFilter === 'ALL' ? true : a.layer === layerFilter,
  );

  if (loading || !project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-1.5">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Meus Projetos
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{project.name}</h1>
            <Badge variant="outline">{project.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">{project.plainIdea}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canWrite && (
            <Button variant="outline" onClick={handleGenerateCode} disabled={busyAction}>
              <RefreshCw className={`h-4 w-4 ${busyAction ? 'animate-spin' : ''}`} />
              {project.generatedFilesCount > 0 ? 'Atualizar Código' : 'Compilar Código'}
            </Button>
          )}
          <Button variant="accent" onClick={handleDownloadZip} disabled={busyAction}>
            <Download className="h-4 w-4" />
            Baixar Sistema (.ZIP)
          </Button>
        </div>
      </div>

      {!project.blueprintJson ? (
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Este sistema ainda não possui telas montadas</CardTitle>
            <CardDescription>
              Clique abaixo para montar as telas e campos automaticamente a partir da sua descrição.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3">
            {canWrite && (
              <Button variant="accent" onClick={handleGenerateBlueprintNow} disabled={busyAction}>
                <Sparkles className="h-4 w-4" />
                {busyAction ? 'Montando...' : 'Montar Telas Automaticamente'}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">
              <Play className="h-4 w-4" />
              Testar Sistema
            </TabsTrigger>
            <TabsTrigger value="editor">
              <Layers className="h-4 w-4" />
              Editar Telas
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code2 className="h-4 w-4" />
              Código & Download ({bundle?.artifacts.length || 0})
            </TabsTrigger>
            {canWrite && (
              <TabsTrigger value="ai-bridge">
                <Bot className="h-4 w-4" />
                Refinar com Assinatura
              </TabsTrigger>
            )}
            <TabsTrigger value="history">
              <History className="h-4 w-4" />
              Histórico ({bundle?.jobs.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <LivePrototypePreview blueprint={project.blueprintJson} />
          </TabsContent>

          <TabsContent value="editor">
            <BlueprintVisualEditor
              blueprint={project.blueprintJson}
              onSave={handleSaveBlueprint}
              saving={busyAction}
              readOnly={!canWrite}
            />
          </TabsContent>

          {canWrite && (
            <TabsContent value="ai-bridge">
              <SubscriptionBridgePanel
                projectId={project.id}
                initialPrompt={project.plainIdea}
                onImported={async () => {
                  await loadAll();
                }}
              />
            </TabsContent>
          )}

          <TabsContent value="code">
            {!bundle || bundle.artifacts.length === 0 ? (
              <Card className="p-8 text-center">
                <CardHeader>
                  <CardTitle>Nenhum arquivo compilado ainda</CardTitle>
                  <CardDescription>
                    Clique em &ldquo;Gerar Código Completo&rdquo; para produzir o schema Prisma, API NestJS, Frontend Next.js, Docker e pacote Antigravity.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {canWrite && (
                    <Button onClick={handleGenerateCode} disabled={busyAction}>
                      <Code2 className="h-4 w-4" />
                      Gerar Todos os Arquivos Agora
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-12">
                <Card className="lg:col-span-4 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Arquivos do Projeto</CardTitle>
                    <select
                      className="mt-2 h-9 w-full rounded-lg border border-border bg-white px-2.5 text-xs"
                      value={layerFilter}
                      onChange={(e) => setLayerFilter(e.target.value)}
                    >
                      {Object.entries(LAYER_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          Camada: {label}
                        </option>
                      ))}
                    </select>
                  </CardHeader>
                  <CardContent className="max-h-[540px] overflow-y-auto space-y-1">
                    {filteredArtifacts.map((art) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => setSelectedArtifact(art)}
                        className={`w-full rounded-lg px-2.5 py-2 text-left font-mono text-xs transition cursor-pointer ${
                          selectedArtifact?.id === art.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="truncate">{art.filePath}</div>
                        <div
                          className={`text-[10px] ${
                            selectedArtifact?.id === art.id
                              ? 'text-primary-foreground/80'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {LAYER_LABELS[art.layer] || art.layer} · {art.sizeBytes} bytes
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-8 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/40 py-3">
                    <CardTitle className="font-mono text-sm">
                      {selectedArtifact?.filePath || 'Selecione um arquivo'}
                    </CardTitle>
                    {selectedArtifact && (
                      <Button size="sm" variant="outline" onClick={handleCopyArtifact}>
                        {copiedFile ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedFile ? 'Copiado' : 'Copiar Código'}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="max-h-[540px] overflow-auto bg-stone-950 p-4 font-mono text-xs text-stone-100 leading-relaxed">
                      <code>{selectedArtifact?.content || ''}</code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execuções da Fábrica</CardTitle>
                <CardDescription>
                  Registro de modelagens, pontes com assinaturas de IA e gerações de código.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bundle?.jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>
                ) : (
                  bundle?.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3.5"
                    >
                      <div className="space-y-0.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <Badge variant={job.status === 'FAILED' ? 'destructive' : 'success'}>
                            {job.status}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">
                            {job.mode}
                          </span>
                          {job.durationMs !== null && (
                            <span className="text-xs text-muted-foreground">
                              · {job.durationMs}ms
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">{job.promptUsed}</p>
                        {job.errorMessage && (
                          <p className="text-xs text-destructive">{job.errorMessage}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

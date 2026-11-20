'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  AiProviderResponse,
  AppTemplateResponse,
  CreateProjectSchema,
  SoftwareProjectResponse,
} from '@software-factory/shared';
import { ApiClientError } from '@/lib/api-client';
import { projectsService } from '@/services/projects.service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Label, Textarea } from '@/components/ui/input';

interface ProjectFormProps {
  onOpenChange: (open: boolean) => void;
  editingProject: SoftwareProjectResponse | null;
  templates: AppTemplateResponse[];
  providers: AiProviderResponse[];
  onSaved: (project: SoftwareProjectResponse) => void;
}

function ProjectFormInner({
  onOpenChange,
  editingProject,
  templates,
  providers,
  onSaved,
}: ProjectFormProps) {
  const [name, setName] = useState(editingProject?.name || '');
  const [plainIdea, setPlainIdea] = useState(editingProject?.plainIdea || '');
  const [targetAudience, setTargetAudience] = useState(editingProject?.targetAudience || '');
  const [templateId, setTemplateId] = useState(editingProject?.templateId || '');
  const [aiProviderId, setAiProviderId] = useState(
    editingProject?.aiProviderId || providers.find((p) => p.isDefault)?.id || '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = CreateProjectSchema.safeParse({
      name,
      plainIdea,
      targetAudience: targetAudience || undefined,
      templateId: templateId || undefined,
      aiProviderId: aiProviderId || undefined,
    });

    if (!validation.success) {
      const nextErrs: Record<string, string> = {};
      for (const issue of validation.error.errors) {
        const key = String(issue.path[0] || 'form');
        nextErrs[key] = issue.message;
      }
      setErrors(nextErrs);
      toast.error('Revise os campos destacados antes de salvar.');
      return;
    }

    setSubmitting(true);
    try {
      const saved = editingProject
        ? await projectsService.update(editingProject.id, {
            name: validation.data.name,
            plainIdea: validation.data.plainIdea,
            targetAudience: validation.data.targetAudience,
            aiProviderId: validation.data.aiProviderId || null,
          })
        : await projectsService.create(validation.data);

      toast.success(
        editingProject ? 'Projeto atualizado com sucesso!' : 'Projeto criado com sucesso!',
      );
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiClientError && err.details?.length) {
        toast.error(`${err.message}: ${err.details[0]}`);
      } else {
        toast.error(err instanceof Error ? err.message : 'Erro ao salvar projeto.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="proj-name">Nome do seu sistema</Label>
        <Input
          id="proj-name"
          placeholder="Ex: Agenda da Minha Clínica"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proj-idea">O que esse sistema deve organizar?</Label>
        <Textarea
          id="proj-idea"
          placeholder="Ex: Quero cadastrar clientes, serviços com preço e controlar os horários marcados na semana."
          value={plainIdea}
          onChange={(e) => setPlainIdea(e.target.value)}
        />
        {errors.plainIdea && <p className="text-xs text-destructive">{errors.plainIdea}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proj-audience">Quem vai usar? (opcional)</Label>
        <Input
          id="proj-audience"
          placeholder="Ex: Dono da loja e 2 vendedores"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
        />
      </div>

      {!editingProject && templates.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="proj-template">Começar a partir de um modelo pronto? (opcional)</Label>
          <select
            id="proj-template"
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">Criar do zero usando minha descrição</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>
        </div>
      )}

      {providers.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="proj-provider">Conector de IA preferido</Label>
          <select
            id="proj-provider"
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
            value={aiProviderId}
            onChange={(e) => setAiProviderId(e.target.value)}
          >
            <option value="">Padrão automático</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.subscriptionBrand})
              </option>
            ))}
          </select>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  editingProject,
  templates,
  providers,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProject: SoftwareProjectResponse | null;
  templates: AppTemplateResponse[];
  providers: AiProviderResponse[];
  onSaved: (project: SoftwareProjectResponse) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingProject ? 'Editar Projeto de Software' : 'Novo Projeto de Software'}
          </DialogTitle>
          <DialogDescription>
            Descreva com suas palavras o que o sistema deve fazer. Você poderá gerar e testar as telas em seguida.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <ProjectFormInner
            key={editingProject?.id || 'create-new'}
            onOpenChange={onOpenChange}
            editingProject={editingProject}
            templates={templates}
            providers={providers}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

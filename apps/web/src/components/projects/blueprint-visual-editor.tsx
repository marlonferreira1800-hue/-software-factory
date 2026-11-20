'use client';

import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AppBlueprint,
  BlueprintEntity,
  EntityField,
  FieldType,
} from '@software-factory/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Switch } from '@/components/ui/tabs';

const FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string }> = [
  { value: 'string', label: 'Texto curto (ex: Nome)' },
  { value: 'text', label: 'Texto longo (Observações)' },
  { value: 'phone', label: 'Telefone / WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'currency', label: 'Valor em Dinheiro (R$)' },
  { value: 'int', label: 'Número inteiro (Qtd)' },
  { value: 'date', label: 'Data' },
  { value: 'datetime', label: 'Data e Horário' },
  { value: 'boolean', label: 'Sim / Não (Caixa de seleção)' },
  { value: 'enum', label: 'Lista de Opções (Status)' },
];

function slugifyLocal(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'modulo';
}

function toCamelLocal(value: string): string {
  const words = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'campo';
  return words
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join('');
}

function toPascalLocal(value: string): string {
  const camel = toCamelLocal(value);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function BlueprintVisualEditor({
  blueprint,
  onSave,
  saving = false,
  readOnly = false,
}: {
  blueprint: AppBlueprint;
  onSave: (next: AppBlueprint) => Promise<void> | void;
  saving?: boolean;
  readOnly?: boolean;
}) {
  const [draft, setDraft] = useState<AppBlueprint>(() => structuredClone(blueprint));
  const [newEntityLabel, setNewEntityLabel] = useState('');

  function addField(entityIdx: number) {
    const next = structuredClone(draft);
    const num = next.entities[entityIdx].fields.length + 1;
    const newField: EntityField = {
      name: `campo${num}`,
      label: `Novo Campo ${num}`,
      type: 'string',
      required: false,
      unique: false,
      searchable: true,
      showInTable: true,
    };
    next.entities[entityIdx].fields.push(newField);
    setDraft(next);
  }

  function removeField(entityIdx: number, fieldIdx: number) {
    if (draft.entities[entityIdx].fields.length <= 1) {
      toast.error('Cada tela precisa manter pelo menos 1 campo.');
      return;
    }
    const next = structuredClone(draft);
    next.entities[entityIdx].fields.splice(fieldIdx, 1);
    setDraft(next);
  }

  function addEntity() {
    const label = newEntityLabel.trim();
    if (label.length < 2) {
      toast.error('Informe o nome da nova tela/cadastro (ex: Fornecedores).');
      return;
    }
    const next = structuredClone(draft);
    const name = toPascalLocal(label);
    const slug = slugifyLocal(label);
    if (next.entities.some((e) => e.slug === slug)) {
      toast.error('Já existe uma tela com esse nome.');
      return;
    }
    const entity: BlueprintEntity = {
      name,
      slug,
      label,
      pluralLabel: label.endsWith('s') ? label : `${label}s`,
      description: `Gerenciamento completo de ${label.toLowerCase()}.`,
      icon: 'FolderKanban',
      softDelete: true,
      readRoles: ['ADMIN', 'BUILDER', 'VIEWER'],
      writeRoles: ['ADMIN', 'BUILDER'],
      fields: [
        {
          name: 'nome',
          label: 'Nome / Título',
          type: 'string',
          required: true,
          unique: false,
          searchable: true,
          showInTable: true,
        },
        {
          name: 'observacoes',
          label: 'Observações',
          type: 'text',
          required: false,
          unique: false,
          searchable: false,
          showInTable: false,
        },
      ],
    };
    next.entities.push(entity);
    setDraft(next);
    setNewEntityLabel('');
    toast.success(`Tela "${entity.pluralLabel}" adicionada! Não esqueça de salvar.`);
  }

  function removeEntity(entityIdx: number) {
    if (draft.entities.length <= 1) {
      toast.error('O aplicativo precisa ter pelo menos 1 tela.');
      return;
    }
    const next = structuredClone(draft);
    next.entities.splice(entityIdx, 1);
    setDraft(next);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <h3 className="font-display text-base font-semibold">
            {draft.appName} — {draft.entities.length} telas planejadas
          </h3>
          <p className="text-sm text-muted-foreground">{draft.tagline}</p>
        </div>
        {!readOnly && (
          <Button type="button" onClick={() => onSave(draft)} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Salvando alterações...' : 'Salvar Estrutura do Sistema'}
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {draft.entities.map((entity, eIdx) => (
          <Card key={entity.slug}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{entity.pluralLabel}</CardTitle>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      /{entity.slug}
                    </Badge>
                  </div>
                  <CardDescription>{entity.description}</CardDescription>
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEntity(eIdx)}
                    title="Remover tela"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {entity.fields.map((field, fIdx) => (
                <div
                  key={`${entity.slug}-${fIdx}`}
                  className="grid gap-2 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-12 items-center"
                >
                  <div className="sm:col-span-5">
                    <Label className="text-[11px] text-muted-foreground">Nome do Campo</Label>
                    <Input
                      disabled={readOnly}
                      value={field.label}
                      onChange={(e) => {
                        const next = structuredClone(draft);
                        next.entities[eIdx].fields[fIdx].label = e.target.value;
                        next.entities[eIdx].fields[fIdx].name = toCamelLocal(e.target.value);
                        setDraft(next);
                      }}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Label className="text-[11px] text-muted-foreground">Tipo da Informação</Label>
                    <select
                      disabled={readOnly}
                      value={field.type}
                      onChange={(e) => {
                        const next = structuredClone(draft);
                        const nextType = e.target.value as FieldType;
                        next.entities[eIdx].fields[fIdx].type = nextType;
                        if (nextType === 'enum' && !next.entities[eIdx].fields[fIdx].enumValues?.length) {
                          next.entities[eIdx].fields[fIdx].enumValues = ['PENDENTE', 'CONCLUIDO'];
                        }
                        setDraft(next);
                      }}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-white px-2 text-xs"
                    >
                      {FIELD_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between sm:flex-col sm:items-start gap-1">
                    <span className="text-[11px] text-muted-foreground">Obrigatório</span>
                    <Switch
                      disabled={readOnly}
                      checked={field.required}
                      onCheckedChange={(checked) => {
                        const next = structuredClone(draft);
                        next.entities[eIdx].fields[fIdx].required = checked;
                        setDraft(next);
                      }}
                    />
                  </div>
                  {!readOnly && (
                    <div className="sm:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeField(eIdx, fIdx)}
                        title="Remover campo"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => addField(eIdx)}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Campo em {entity.pluralLabel}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!readOnly && (
        <Card className="bg-muted/40">
          <CardContent className="flex flex-wrap items-end gap-3 pt-5">
            <div className="flex-1 min-w-[220px] space-y-1.5">
              <Label htmlFor="new-entity-name">Quer adicionar mais uma tela/cadastro ao sistema?</Label>
              <Input
                id="new-entity-name"
                placeholder="Ex: Fornecedor, Despesa, Produto..."
                value={newEntityLabel}
                onChange={(e) => setNewEntityLabel(e.target.value)}
              />
            </div>
            <Button type="button" variant="secondary" onClick={addEntity}>
              <Plus className="h-4 w-4" />
              Adicionar Nova Tela
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppBlueprint, BlueprintEntity } from '@software-factory/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';

function buildSampleRows(entity: BlueprintEntity): Array<Record<string, string | boolean>> {
  const row1: Record<string, string | boolean> = { id: 'sim-1' };
  const row2: Record<string, string | boolean> = { id: 'sim-2' };

  for (const f of entity.fields) {
    if (f.type === 'boolean') {
      row1[f.name] = true;
      row2[f.name] = false;
    } else if (f.type === 'currency') {
      row1[f.name] = '120.00';
      row2[f.name] = '85.50';
    } else if (f.type === 'int') {
      row1[f.name] = '15';
      row2[f.name] = '4';
    } else if (f.type === 'email') {
      row1[f.name] = 'joao@exemplo.com';
      row2[f.name] = 'maria@exemplo.com';
    } else if (f.type === 'phone') {
      row1[f.name] = '(11) 98765-4321';
      row2[f.name] = '(21) 99123-4567';
    } else if (f.type === 'enum' && f.enumValues?.length) {
      row1[f.name] = f.enumValues[0];
      row2[f.name] = f.enumValues[1] || f.enumValues[0];
    } else if (f.type === 'date' || f.type === 'datetime') {
      row1[f.name] = '2026-11-20';
      row2[f.name] = '2026-11-21';
    } else {
      row1[f.name] = `${f.label} Exemplo 1`;
      row2[f.name] = `${f.label} Exemplo 2`;
    }
  }

  return [row1, row2];
}

export function LivePrototypePreview({ blueprint }: { blueprint: AppBlueprint }) {
  const [selectedSlug, setSelectedSlug] = useState(blueprint.entities[0]?.slug || '');
  const [search, setSearch] = useState('');
  const [store, setStore] = useState<Record<string, Array<Record<string, string | boolean>>>>(() => {
    const initial: Record<string, Array<Record<string, string | boolean>>> = {};
    for (const ent of blueprint.entities) {
      initial[ent.slug] = buildSampleRows(ent);
    }
    return initial;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, string | boolean>>({});

  const activeEntity = useMemo(
    () => blueprint.entities.find((e) => e.slug === selectedSlug) || blueprint.entities[0],
    [blueprint.entities, selectedSlug],
  );

  if (!activeEntity) return null;

  const visibleColumns = activeEntity.fields.filter((f) => f.showInTable).slice(0, 5);
  const rows = (store[activeEntity.slug] || []).filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(q));
  });

  function openCreate() {
    const fresh: Record<string, string | boolean> = {};
    for (const f of activeEntity.fields) {
      fresh[f.name] =
        f.type === 'boolean' ? true : f.type === 'enum' && f.enumValues?.length ? f.enumValues[0] : '';
    }
    setEditingId(null);
    setFormState(fresh);
    setModalOpen(true);
  }

  function openEdit(row: Record<string, string | boolean>) {
    setEditingId(String(row.id));
    setFormState({ ...row });
    setModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    for (const f of activeEntity.fields) {
      if (f.required && f.type !== 'boolean' && !String(formState[f.name] || '').trim()) {
        toast.error(`Preencha o campo obrigatório "${f.label}".`);
        return;
      }
    }

    const currentRows = store[activeEntity.slug] || [];
    if (editingId) {
      const updated = currentRows.map((r) =>
        r.id === editingId ? { ...formState, id: editingId } : r,
      );
      setStore({ ...store, [activeEntity.slug]: updated });
      toast.success(`${activeEntity.label} atualizado no simulador!`);
    } else {
      const newRow = { ...formState, id: `sim-${Date.now()}` };
      setStore({ ...store, [activeEntity.slug]: [newRow, ...currentRows] });
      toast.success(`${activeEntity.label} cadastrado no simulador!`);
    }
    setModalOpen(false);
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    const currentRows = store[activeEntity.slug] || [];
    setStore({
      ...store,
      [activeEntity.slug]: currentRows.filter((r) => r.id !== deleteTargetId),
    });
    setDeleteTargetId(null);
    toast.success('Registro removido da simulação.');
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border bg-muted/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{blueprint.appName} — Simulador Interativo</CardTitle>
              <Badge variant="success">Preview ao Vivo</Badge>
            </div>
            <CardDescription className="mt-1">
              Experimente agora como seu usuário final vai navegar, cadastrar, buscar e excluir dados.
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-3">
          {blueprint.entities.map((entity) => (
            <Button
              key={entity.slug}
              type="button"
              size="sm"
              variant={entity.slug === activeEntity.slug ? 'default' : 'outline'}
              onClick={() => {
                setSelectedSlug(entity.slug);
                setSearch('');
              }}
            >
              {entity.pluralLabel}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={`Buscar em ${activeEntity.pluralLabel.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo {activeEntity.label}
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                {visibleColumns.map((col) => (
                  <th key={col.name} className="px-4 py-3 text-left font-semibold">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 1}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nenhum registro encontrado nessa simulação.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={String(row.id)} className="border-t border-border hover:bg-muted/30">
                    {visibleColumns.map((col) => {
                      const raw = row[col.name];
                      let formatted = String(raw ?? '-');
                      if (col.type === 'boolean') formatted = raw ? 'Sim' : 'Não';
                      if (col.type === 'currency' && raw) formatted = `R$ ${raw}`;
                      return (
                        <td key={col.name} className="px-4 py-3">
                          {col.type === 'enum' ? (
                            <Badge variant="secondary">{formatted}</Badge>
                          ) : (
                            formatted
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTargetId(String(row.id))}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar' : 'Cadastrar'} {activeEntity.label}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            {activeEntity.fields.map((field) => (
              <div key={field.name} className="space-y-1">
                <Label>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                {field.type === 'boolean' ? (
                  <label className="flex items-center gap-2 text-sm pt-1">
                    <input
                      type="checkbox"
                      checked={Boolean(formState[field.name])}
                      onChange={(e) =>
                        setFormState({ ...formState, [field.name]: e.target.checked })
                      }
                    />
                    Ativo / Confirmado
                  </label>
                ) : field.type === 'enum' && field.enumValues?.length ? (
                  <select
                    className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                    value={String(formState[field.name] || field.enumValues[0])}
                    onChange={(e) =>
                      setFormState({ ...formState, [field.name]: e.target.value })
                    }
                  >
                    {field.enumValues.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={
                      field.type === 'int' || field.type === 'currency' || field.type === 'decimal'
                        ? 'number'
                        : field.type === 'email'
                          ? 'email'
                          : field.type === 'date'
                            ? 'date'
                            : 'text'
                    }
                    placeholder={field.placeholder || field.label}
                    value={String(formState[field.name] ?? '')}
                    onChange={(e) =>
                      setFormState({ ...formState, [field.name]: e.target.value })
                    }
                  />
                )}
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar no Simulador</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title={`Excluir ${activeEntity.label}?`}
        description="Esta confirmação demonstra a proteção contra exclusões acidentais gerada automaticamente no seu sistema."
        onConfirm={confirmDelete}
      />
    </Card>
  );
}

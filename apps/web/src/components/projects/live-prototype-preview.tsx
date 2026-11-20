'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppBlueprint, BlueprintEntity } from '@software-factory/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';

const SAMPLE_NAMES = ['Lucas Almeida', 'Mariana Costa', 'Rafael Souza'];
const SAMPLE_ITEMS = ['Atendimento Completo', 'Produto Selecionado', 'Pedido #104'];

function buildSampleRows(entity: BlueprintEntity): Array<Record<string, string | boolean>> {
  return [0, 1, 2].map((idx) => {
    const row: Record<string, string | boolean> = { id: `sim-${idx + 1}` };
    for (const f of entity.fields) {
      if (f.type === 'boolean') {
        row[f.name] = idx !== 1;
      } else if (f.type === 'currency') {
        row[f.name] = ['120,00', '85,50', '210,00'][idx];
      } else if (f.type === 'int') {
        row[f.name] = ['18', '7', '32'][idx];
      } else if (f.type === 'email') {
        row[f.name] = ['lucas@exemplo.com', 'mariana@exemplo.com', 'rafael@exemplo.com'][idx];
      } else if (f.type === 'phone') {
        row[f.name] = ['(11) 98765-4321', '(21) 99123-4567', '(31) 99812-1044'][idx];
      } else if (f.type === 'enum' && f.enumValues?.length) {
        row[f.name] = f.enumValues[idx % f.enumValues.length];
      } else if (f.type === 'date' || f.type === 'datetime') {
        row[f.name] = ['20/11/2026 14:30', '20/11/2026 16:00', '21/11/2026 09:30'][idx];
      } else if (f.name.toLowerCase().includes('cliente') || f.name.toLowerCase().includes('nome') || f.name.toLowerCase().includes('responsavel')) {
        row[f.name] = SAMPLE_NAMES[idx];
      } else {
        row[f.name] = `${SAMPLE_ITEMS[idx]}`;
      }
    }
    return row;
  });
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
      toast.success(`${activeEntity.label} atualizado!`);
    } else {
      const newRow = { ...formState, id: `sim-${Date.now()}` };
      setStore({ ...store, [activeEntity.slug]: [newRow, ...currentRows] });
      toast.success(`${activeEntity.label} cadastrado!`);
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
    toast.success('Registro removido.');
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {/* App Window Chrome */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#F5F3EE] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          </div>
          <span className="text-sm font-semibold text-foreground">{blueprint.appName}</span>
          <Badge variant="success">Interativo</Badge>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {blueprint.entities.map((entity) => (
            <button
              key={entity.slug}
              type="button"
              onClick={() => {
                setSelectedSlug(entity.slug);
                setSearch('');
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                entity.slug === activeEntity.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border hover:text-foreground'
              }`}
            >
              {entity.pluralLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Simulated Screen Body */}
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">{activeEntity.pluralLabel}</h3>
            <p className="text-xs text-muted-foreground">{activeEntity.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 pl-8 text-xs"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="button" variant="accent" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo {activeEntity.label}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                {visibleColumns.map((col) => (
                  <th key={col.name} className="px-4 py-2.5 text-left font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 1}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Nenhum registro encontrado. Clique em &ldquo;+ Novo {activeEntity.label}&rdquo; para testar!
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
                        <td key={col.name} className="px-4 py-3 text-sm">
                          {col.type === 'enum' ? (
                            <Badge variant="default">{formatted}</Badge>
                          ) : (
                            formatted
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(row)}>
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
      </div>

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
              <Button type="submit" variant="accent">
                Salvar
              </Button>
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
        description="Confirmação automática contra exclusões acidentais incluída no sistema gerado."
        onConfirm={confirmDelete}
      />
    </div>
  );
}

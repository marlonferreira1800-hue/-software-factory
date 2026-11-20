'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  CreateUserSchema,
  PaginatedMeta,
  UpdateUserSchema,
  UserResponse,
  UserRole,
} from '@software-factory/shared';
import { useAuth } from '@/lib/auth-context';
import { usersService } from '@/services/users.service';
import { DeleteConfirmDialog } from '@/components/common/delete-confirm-dialog';
import { PaginationBar } from '@/components/common/pagination-bar';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Label, Skeleton } from '@/components/ui/input';
import { Switch } from '@/components/ui/tabs';

export default function AdminUsersPage() {
  const { user: currentUser, hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('BUILDER');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await usersService.list({
        page,
        pageSize: 10,
        search: search || undefined,
        role: (roleFilter as UserRole) || undefined,
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao listar usuários.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, search, roleFilter]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  function openCreate() {
    setEditing(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('BUILDER');
    setIsActive(true);
    setModalOpen(true);
  }

  function openEdit(u: UserResponse) {
    setEditing(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setIsActive(u.isActive);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      const parsed = UpdateUserSchema.safeParse({
        name,
        email,
        password: password || undefined,
        role,
        isActive,
      });
      if (!parsed.success) {
        toast.error(parsed.error.errors[0]?.message || 'Dados inválidos.');
        return;
      }
      setSubmitting(true);
      try {
        await usersService.update(editing.id, parsed.data);
        toast.success('Usuário atualizado!');
        setModalOpen(false);
        load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao atualizar.');
      } finally {
        setSubmitting(false);
      }
    } else {
      const parsed = CreateUserSchema.safeParse({ name, email, password, role, isActive });
      if (!parsed.success) {
        toast.error(parsed.error.errors[0]?.message || 'Dados inválidos.');
        return;
      }
      setSubmitting(true);
      try {
        await usersService.create(parsed.data);
        toast.success('Usuário cadastrado!');
        setModalOpen(false);
        load();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao criar usuário.');
      } finally {
        setSubmitting(false);
      }
    }
  }

  async function confirmDelete() {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      await usersService.remove(deletingUser.id);
      toast.success('Usuário removido.');
      setDeletingUser(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      {!isAdmin ? (
        <Card className="p-8 text-center">
          <p className="font-display text-lg font-semibold">
            Acesso restrito a Administradores (RBAC)
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Usuários & Permissões (RBAC)
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie contas, níveis de acesso (ADMIN, BUILDER, VIEWER) e status.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
            <select
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm"
              value={roleFilter}
              onChange={(e) => {
                setPage(1);
                setRoleFilter(e.target.value);
              }}
            >
              <option value="">Todos os papéis</option>
              <option value="ADMIN">ADMIN</option>
              <option value="BUILDER">BUILDER</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">E-mail</th>
                        <th className="px-4 py-3 text-left">Papel RBAC</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-t border-border">
                          <td className="px-4 py-3 font-medium">{u.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant={u.role === 'ADMIN' ? 'warning' : 'default'}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.isActive ? 'success' : 'destructive'}>
                              {u.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(u)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {u.id !== currentUser?.id && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeletingUser(u)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <PaginationBar meta={meta} onPageChange={setPage} />
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>
                Senha {editing && <span className="text-muted-foreground">(deixe vazio para manter)</span>}
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Papel RBAC</Label>
              <select
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="ADMIN">ADMIN (Administrador Total)</option>
                <option value="BUILDER">BUILDER (Criador de Sistemas)</option>
                <option value="VIEWER">VIEWER (Somente Leitura)</option>
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Conta ativa</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
        title={`Excluir usuário "${deletingUser?.name}"?`}
        description="O usuário será desativado e removido da listagem ativa."
        loading={submitting}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}

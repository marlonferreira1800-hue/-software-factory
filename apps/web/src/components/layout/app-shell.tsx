'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Blocks,
  Bot,
  FolderKanban,
  Hammer,
  LayoutTemplate,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { isBrowserOnlyMode } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  BUILDER: 'Criador',
  VIEWER: 'Consulta',
};

export function AppShell({
  children,
  requireAuth = true,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const { user, loading, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (requireAuth && !loading && !user) {
      router.replace('/login');
    }
  }, [requireAuth, loading, user, router]);

  if (requireAuth && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Hammer className="h-5 w-5 animate-bounce text-primary" />
          <span>Preparando sua oficina de software...</span>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  const navItems = [
    { href: '/wizard', label: 'Criar Sistema', icon: Sparkles, show: hasRole('ADMIN', 'BUILDER') },
    { href: '/projects', label: 'Meus Projetos', icon: FolderKanban, show: true },
    { href: '/templates', label: 'Modelos Prontos', icon: LayoutTemplate, show: true },
    { href: '/ai-connectors', label: 'Minhas IAs', icon: Bot, show: true },
    { href: '/admin/users', label: 'Usuários (RBAC)', icon: ShieldCheck, show: hasRole('ADMIN') },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Blocks className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <span className="font-display text-base font-bold tracking-tight text-foreground">
                  Fábrica Livre
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  Open-Source Software Factory
                </span>
              </div>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isBrowserOnlyMode() && (
              <Badge variant="outline" className="hidden lg:inline-flex">
                Modo Navegador
              </Badge>
            )}
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5">
                  <div className="text-right leading-tight">
                    <p className="text-xs font-semibold text-foreground">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={user.role === 'ADMIN' ? 'warning' : 'default'}>
                    {ROLE_LABELS[user.role] || user.role}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  title="Sair da conta"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
                <button
                  type="button"
                  aria-label="Abrir menu"
                  onClick={() => setMobileOpen((prev) => !prev)}
                  className="md:hidden rounded-lg border border-border p-2 text-foreground"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/login?mode=register">Criar Conta Grátis</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {user && mobileOpen && (
          <div className="border-t border-border bg-card px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">{children}</main>
    </div>
  );
}

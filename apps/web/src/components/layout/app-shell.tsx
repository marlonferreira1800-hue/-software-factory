'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FolderKanban,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Plug,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';
import { isBrowserOnlyMode } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  BUILDER: 'Criador',
  VIEWER: 'Consulta',
};

function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect width="28" height="28" rx="7" fill="#171614" />
        <rect x="6" y="6" width="7" height="7" rx="1.5" fill="#FAF9F6" />
        <rect x="15" y="6" width="7" height="7" rx="1.5" fill="#B93815" />
        <rect x="6" y="15" width="16" height="7" rx="1.5" fill="#FAF9F6" fillOpacity="0.88" />
      </svg>
      <span className="font-display text-[17px] font-semibold tracking-tight text-foreground whitespace-nowrap">
        Fábrica Livre
      </span>
    </Link>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function AppShell({
  children,
  requireAuth = true,
  layoutMode = 'workspace',
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
  layoutMode?: 'editorial' | 'workspace';
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
        <div className="text-sm text-muted-foreground">Carregando oficina...</div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Início', icon: Home, show: true },
    { href: '/projects', label: 'Meus Sistemas', icon: FolderKanban, show: true },
    { href: '/templates', label: 'Modelos Prontos', icon: LayoutGrid, show: true },
    { href: '/ai-connectors', label: 'Integrações', icon: Plug, show: true },
    { href: '/admin/users', label: 'Usuários', icon: ShieldCheck, show: hasRole('ADMIN') },
  ].filter((item) => item.show);

  if (layoutMode === 'editorial') {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <BrandLogo />

            <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
              <Link
                href="/templates"
                className="text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
              >
                Modelos Prontos
              </Link>
              <Link
                href="/projects"
                className="text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
              >
                Meus Sistemas
              </Link>
              <Link
                href="/ai-connectors"
                className="text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
              >
                Integrações
              </Link>
            </nav>

            <div className="flex items-center gap-2.5">
              {!user ? (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Entrar</Link>
                  </Button>
                  <Button variant="accent" size="sm" asChild>
                    <Link href="/login?mode=register">Criar Sistema</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/projects">Meus Sistemas</Link>
                  </Button>
                  <Button variant="accent" size="sm" asChild>
                    <Link href="/wizard">
                      <Plus className="h-4 w-4" />
                      Novo Sistema
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:justify-between border-r border-border bg-[#F5F3EE] p-4">
        <div className="space-y-6">
          <div className="px-2 pt-1">
            <BrandLogo />
          </div>

          {hasRole('ADMIN', 'BUILDER') && (
            <Button variant="accent" className="w-full justify-start" asChild>
              <Link href="/wizard">
                <Plus className="h-4 w-4" />
                Novo Sistema
              </Link>
            </Button>
          )}

          <nav className="space-y-1" aria-label="Menu lateral">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    active
                      ? 'bg-card text-foreground shadow-2xs border border-border'
                      : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {user && (
          <div className="space-y-2 border-t border-border pt-4">
            {isBrowserOnlyMode() && (
              <p className="px-2 text-[11px] text-muted-foreground">
                Salvo automaticamente neste navegador
              </p>
            )}
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-2.5 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {user.name.replace(/\s*\(Modo Demonstração\)/i, '')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {ROLE_LABELS[user.role] || user.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                title="Sair / Trocar conta"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Top Bar */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-sm lg:hidden">
          <BrandLogo />
          <div className="flex items-center gap-2">
            {hasRole('ADMIN', 'BUILDER') && (
              <Button variant="accent" size="sm" asChild>
                <Link href="/wizard">
                  <Plus className="h-4 w-4" />
                  Novo
                </Link>
              </Button>
            )}
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="rounded-lg border border-border p-1.5 text-foreground"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="border-b border-border bg-card px-4 py-3 lg:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium',
                      active ? 'bg-secondary text-foreground' : 'text-muted-foreground',
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

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

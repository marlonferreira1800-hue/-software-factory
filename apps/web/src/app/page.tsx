'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Download,
  FolderKanban,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SUPPORTED_AIS = [
  { name: 'Antigravity', desc: 'Exporta pacotes AGENTS.md + blueprint e ponte direta.' },
  { name: 'ChatGPT', desc: 'Use sua assinatura Plus/Pro no navegador ou Codex CLI.' },
  { name: 'Claude', desc: 'Compatível com Claude.ai Pro/Max e Claude Code CLI.' },
  { name: 'Gemini', desc: 'Integrado ao Google AI / Gemini Web, CLI e API.' },
  { name: 'Ollama Local', desc: 'Rode modelos open-source 100% no seu computador.' },
  { name: 'Motor Offline', desc: 'Geração instantânea em português sem nenhuma conta paga.' },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <AppShell requireAuth={false}>
      <section className="rounded-3xl border border-border bg-card px-6 py-10 sm:px-10 sm:py-14">
        <div className="max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Projeto Open-Source (MIT)</Badge>
            <Badge variant="outline">Sem Jargão Técnico</Badge>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl leading-[1.12]">
            Transforme sua ideia em um sistema completo sem saber programar.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Descreva o que seu negócio precisa em português simples, escolha um modelo pronto ou conecte sua assinatura do{' '}
            <strong className="text-foreground">Antigravity, ChatGPT, Claude ou Gemini</strong>. Teste as telas na hora e baixe o software pronto com banco de dados, API e interface.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" asChild>
              <Link href={user ? '/wizard' : '/login'}>
                <Sparkles className="h-5 w-5" />
                {user ? 'Criar Novo Sistema Agora' : 'Começar Gratuitamente'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={user ? '/templates' : '/login'}>
                Explorar Modelos Prontos
              </Link>
            </Button>
            {user && (
              <Button size="lg" variant="secondary" asChild>
                <Link href="/projects">
                  <FolderKanban className="h-4 w-4" />
                  Meus Projetos
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Sparkles className="h-6 w-6 text-primary mb-1" />
            <CardTitle>1. Conte sua ideia em português</CardTitle>
            <CardDescription>
              Nada de termos difíceis. Diga algo como &ldquo;quero controlar meus clientes e agendamentos&rdquo; ou escolha um modelo pronto.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Layers className="h-6 w-6 text-accent mb-1" />
            <CardTitle>2. Simule antes de baixar</CardTitle>
            <CardDescription>
              Ajuste campos com nomes amigáveis e teste um protótipo interativo no navegador para conferir como o sistema funciona.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Download className="h-6 w-6 text-primary mb-1" />
            <CardTitle>3. Código profissional completo</CardTitle>
            <CardDescription>
              Gera PostgreSQL + Prisma, API NestJS com RBAC e Swagger, Frontend Next.js + Tailwind e Docker Compose em um arquivo .ZIP.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="mt-10 rounded-3xl border border-border bg-muted/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Funciona com suas assinaturas de IA favoritas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use sua assinatura web sem pagar API extra, conecte CLIs locais, APIs próprias ou rode 100% offline.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={user ? '/ai-connectors' : '/login'}>Configurar Conectores</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORTED_AIS.map((ai) => (
            <div
              key={ai.name}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground">{ai.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ai.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
          <div>
            <h3 className="font-display font-semibold text-base">
              Segurança e Padrão de Produção Inclusos
            </h3>
            <p className="text-sm text-muted-foreground">
              Todo código gerado já nasce com validação estrita Zod, controle de permissões (RBAC), exclusão segura (soft delete) e Swagger/OpenAPI.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={user ? '/wizard' : '/login'}>Abrir Fábrica</Link>
        </Button>
      </section>
    </AppShell>
  );
}

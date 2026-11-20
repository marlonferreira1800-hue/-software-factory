'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Blocks, KeyRound, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { LoginSchema, RegisterSchema } from '@software-factory/shared';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';

function LoginFormContent() {
  const { user, login, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/projects');
    }
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === 'login') {
      const parsed = LoginSchema.safeParse({ email, password });
      if (!parsed.success) {
        toast.error(parsed.error.errors[0]?.message || 'Dados inválidos.');
        return;
      }
      setSubmitting(true);
      try {
        await login(parsed.data);
        toast.success('Bem-vindo(a) de volta à Fábrica Livre!');
        router.push('/projects');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Falha no login.');
      } finally {
        setSubmitting(false);
      }
    } else {
      const parsed = RegisterSchema.safeParse({ name, email, password });
      if (!parsed.success) {
        toast.error(parsed.error.errors[0]?.message || 'Dados inválidos.');
        return;
      }
      setSubmitting(true);
      try {
        await register(parsed.data);
        toast.success('Conta criada! Seus conectores de IA já foram preparados.');
        router.push('/wizard');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao criar conta.');
      } finally {
        setSubmitting(false);
      }
    }
  }

  function fillDemo(demoEmail: string, demoPass: string) {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Blocks className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Fábrica Livre</h1>
          <p className="text-sm text-muted-foreground">
            Crie seu próprio sistema sem conhecimento técnico
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-lg py-2 text-sm font-medium transition cursor-pointer ${
                  mode === 'login' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-lg py-2 text-sm font-medium transition cursor-pointer ${
                  mode === 'register' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground'
                }`}
              >
                Criar Conta
              </button>
            </div>
            <CardTitle className="pt-2">
              {mode === 'login' ? 'Acesse sua oficina' : 'Comece gratuitamente'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Entre com seu e-mail e senha para gerenciar projetos e baixar códigos.'
                : 'Ao criar conta, seus conectores para Antigravity, ChatGPT, Claude e Gemini são configurados automaticamente.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name">Seu Nome</Label>
                  <Input
                    id="auth-name"
                    placeholder="Ex: Ana Paula"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="auth-email">E-mail</Label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-pass">Senha</Label>
                <Input
                  id="auth-pass"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {mode === 'login' ? (
                  <>
                    <KeyRound className="h-4 w-4" />
                    {submitting ? 'Entrando...' : 'Entrar'}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {submitting ? 'Criando conta...' : 'Criar Minha Conta'}
                  </>
                )}
              </Button>
            </form>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Contas de demonstração (clique para preencher):
              </p>
              <div className="grid gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemo('criador@fabricalivre.org', 'Criador@123')}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-left hover:bg-muted cursor-pointer"
                >
                  <span>
                    <strong>Criador (BUILDER)</strong> — criador@fabricalivre.org
                  </span>
                  <span className="text-primary font-medium">Preencher</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('admin@fabricalivre.org', 'Admin@123')}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-left hover:bg-muted cursor-pointer"
                >
                  <span>
                    <strong>Admin (ADMIN)</strong> — admin@fabricalivre.org
                  </span>
                  <span className="text-primary font-medium">Preencher</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('visitante@fabricalivre.org', 'Visitante@123')}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-left hover:bg-muted cursor-pointer"
                >
                  <span>
                    <strong>Consulta (VIEWER)</strong> — visitante@fabricalivre.org
                  </span>
                  <span className="text-primary font-medium">Preencher</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginFormContent />
    </Suspense>
  );
}

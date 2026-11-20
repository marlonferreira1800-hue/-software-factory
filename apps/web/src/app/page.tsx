'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DEMO_PREVIEWS = [
  {
    id: 'barbearia',
    label: 'Barbearia & Salão',
    appTitle: 'Agenda Bela Corte',
    menu: ['Clientes', 'Serviços', 'Agendamentos'],
    columns: ['Cliente', 'Serviço', 'Horário', 'Status'],
    rows: [
      ['Lucas Almeida', 'Corte + Barba', 'Hoje, 14:30', 'Confirmado'],
      ['Rafael Souza', 'Corte Degradê', 'Hoje, 15:15', 'Pendente'],
      ['Bruno Ferreira', 'Barba Completa', 'Hoje, 16:00', 'Concluído'],
    ],
  },
  {
    id: 'loja',
    label: 'Loja & Estoque',
    appTitle: 'Loja Prática',
    menu: ['Produtos', 'Estoque', 'Pedidos'],
    columns: ['Produto', 'Categoria', 'Preço', 'Estoque'],
    rows: [
      ['Camiseta Algodão Pima', 'Vestuário', 'R$ 89,90', '24 un.'],
      ['Tênis Urbano Branco', 'Calçados', 'R$ 249,00', '9 un.'],
      ['Mochila Lona Café', 'Acessórios', 'R$ 179,00', '14 un.'],
    ],
  },
  {
    id: 'clinica',
    label: 'Clínica & Agenda',
    appTitle: 'Clínica Cuidar',
    menu: ['Pacientes', 'Consultas', 'Retornos'],
    columns: ['Paciente', 'Profissional', 'Data', 'Situação'],
    rows: [
      ['Mariana Costa', 'Dra. Camila', '20/11 · 09:00', 'Agendada'],
      ['Eduardo Lima', 'Dr. Henrique', '20/11 · 10:30', 'Realizada'],
      ['Fernanda Rocha', 'Dra. Camila', '20/11 · 11:15', 'Agendada'],
    ],
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [quickIdea, setQuickIdea] = useState('');
  const [activePreviewId, setActivePreviewId] = useState('barbearia');
  const [previewSearch, setPreviewSearch] = useState('');

  const activePreview =
    DEMO_PREVIEWS.find((d) => d.id === activePreviewId) || DEMO_PREVIEWS[0];

  const filteredRows = activePreview.rows.filter((row) =>
    previewSearch.trim()
      ? row.some((cell) => cell.toLowerCase().includes(previewSearch.toLowerCase()))
      : true,
  );

  function handleQuickStart(e: React.FormEvent) {
    e.preventDefault();
    const target = user ? '/wizard' : '/login';
    if (quickIdea.trim() && user) {
      router.push(`/wizard?idea=${encodeURIComponent(quickIdea.trim())}`);
      return;
    }
    router.push(target);
  }

  return (
    <AppShell requireAuth={false} layoutMode="editorial">
      {/* Asymmetric Editorial Hero + Live Product Showcase */}
      <section className="grid gap-10 lg:grid-cols-12 lg:items-center pt-2 pb-12 border-b border-border">
        <div className="lg:col-span-6 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Software Aberto · Sem Código
          </p>

          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-[46px] leading-[1.08]">
            Crie o sistema do seu negócio em um minuto.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
            Escreva com suas palavras o que sua empresa precisa organizar. A plataforma monta as telas, cria o banco de dados e entrega tudo pronto para testar e baixar.
          </p>

          <form onSubmit={handleQuickStart} className="space-y-3 pt-1 max-w-xl">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Input
                value={quickIdea}
                onChange={(e) => setQuickIdea(e.target.value)}
                placeholder="Ex: Quero controlar agendamentos da minha barbearia..."
                className="h-12 bg-card px-4 text-[15px]"
              />
              <Button type="submit" variant="accent" size="lg" className="h-12 shrink-0 px-6">
                Criar Sistema
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-accent" />
                Funciona direto no navegador
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-accent" />
                Simulador interativo antes de baixar
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-accent" />
                Código 100% seu (MIT)
              </span>
            </div>
          </form>
        </div>

        {/* Live Interactive Mini-App Window */}
        <div className="lg:col-span-6">
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Exemplo gerado:</span>
            {DEMO_PREVIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActivePreviewId(item.id);
                  setPreviewSearch('');
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  activePreviewId === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-border/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-[#F5F3EE] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                <span className="ml-2 text-xs font-semibold text-foreground">
                  {activePreview.appTitle}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {activePreview.menu.map((m, idx) => (
                  <span
                    key={m}
                    className={`rounded px-2 py-0.5 ${
                      idx === 0 ? 'bg-card font-medium text-foreground border border-border' : ''
                    }`}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Buscar na tabela..."
                    className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2.5 text-xs focus:outline-none focus:border-foreground"
                  />
                </div>
                <Link
                  href="/wizard"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  + Novo registro
                </Link>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      {activePreview.columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-t border-border">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2.5 text-foreground">
                            {cIdx === row.length - 1 ? (
                              <span className="inline-block rounded bg-secondary px-2 py-0.5 text-[11px] font-medium">
                                {cell}
                              </span>
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Asymmetric Two-Column Product Breakdown */}
      <section className="grid gap-10 py-12 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Do texto simples ao sistema funcionando — sem telas técnicas no caminho.
          </h2>
          <div className="divide-y divide-border border-y border-border">
            <div className="py-4 flex gap-4">
              <span className="font-mono text-xs font-semibold text-accent pt-1">01</span>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Escolha um modelo ou escreva uma frase
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Não precisa entender de banco de dados ou API. Basta dizer o que você vende, agenda ou controla no dia a dia.
                </p>
              </div>
            </div>
            <div className="py-4 flex gap-4">
              <span className="font-mono text-xs font-semibold text-accent pt-1">02</span>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Teste as telas antes de baixar
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Abra o simulador interativo, cadastre dados de teste, mude nomes de campos com um clique e confira tudo.
                </p>
              </div>
            </div>
            <div className="py-4 flex gap-4">
              <span className="font-mono text-xs font-semibold text-accent pt-1">03</span>
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Baixe o projeto completo em .ZIP
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Vem com Banco PostgreSQL + Prisma, Servidor NestJS seguro, Telas Next.js e Docker pronto para rodar em qualquer lugar.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Extensível & Aberto
              </p>
              <h3 className="font-display text-xl font-semibold mt-1">
                Conecte suas ferramentas preferidas quando quiser
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                O sistema já funciona automaticamente sem precisar de nenhuma assinatura. Mas, se você já usa{' '}
                <strong className="text-foreground">Antigravity, ChatGPT, Claude, Gemini ou Ollama</strong>, pode conectá-los em Integrações para refinar projetos maiores.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {['Antigravity', 'ChatGPT', 'Claude', 'Gemini', 'Ollama', 'Docker'].map((brand) => (
                <span
                  key={brand}
                  className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  {brand}
                </span>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap gap-2.5">
              <Button variant="default" asChild>
                <Link href={user ? '/wizard' : '/login'}>Começar Agora</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/templates">Ver Modelos Prontos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

import { AppBlueprint, BlueprintEntity } from '@software-factory/shared';
import { GeneratedCodeFile } from './nestjs-codegen';

export function generateNextJsFrontend(blueprint: AppBlueprint): GeneratedCodeFile[] {
  const files: GeneratedCodeFile[] = [];

  files.push({
    filePath: 'frontend/package.json',
    layer: 'FRONTEND',
    language: 'json',
    content: JSON.stringify(
      {
        name: `${blueprint.slug}-web`,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'next dev --port 3000',
          build: 'next build',
          start: 'next start --port 3000',
        },
        dependencies: {
          next: '^16.0.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          'lucide-react': '^0.511.0',
          sonner: '^2.0.0',
          zod: '^3.25.0',
        },
        devDependencies: {
          '@tailwindcss/postcss': '^4.1.0',
          tailwindcss: '^4.1.0',
          typescript: '^5.8.0',
        },
      },
      null,
      2,
    ),
  });

  files.push({
    filePath: 'frontend/src/lib/api-client.ts',
    layer: 'FRONTEND',
    language: 'typescript',
    content: [
      `const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';`,
      ``,
      `export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {`,
      `  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;`,
      `  const res = await fetch(\`\${API_URL}\${path}\`, {`,
      `    ...options,`,
      `    headers: {`,
      `      'Content-Type': 'application/json',`,
      `      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),`,
      `      ...(options.headers || {}),`,
      `    },`,
      `  });`,
      `  if (!res.ok) {`,
      `    const err = await res.json().catch(() => ({ message: 'Erro na requisição' }));`,
      `    throw new Error(err.message || 'Erro ao comunicar com o servidor.');`,
      `  }`,
      `  return res.json() as Promise<T>;`,
      `}`,
      ``,
    ].join('\n'),
  });

  files.push({
    filePath: 'frontend/src/app/globals.css',
    layer: 'FRONTEND',
    language: 'css',
    content: [
      `@import "tailwindcss";`,
      ``,
      `body {`,
      `  background-color: #FAF8F5;`,
      `  color: #1C1917;`,
      `}`,
      ``,
    ].join('\n'),
  });

  files.push({
    filePath: 'frontend/src/app/page.tsx',
    layer: 'FRONTEND',
    language: 'tsx',
    content: [
      `import Link from 'next/link';`,
      ``,
      `const MODULES = ${JSON.stringify(
        blueprint.entities.map((e) => ({
          slug: e.slug,
          title: e.pluralLabel,
          description: e.description,
        })),
        null,
        2,
      )};`,
      ``,
      `export default function HomePage() {`,
      `  return (`,
      `    <main className="mx-auto max-w-5xl p-8">`,
      `      <header className="mb-8 border-b border-stone-200 pb-6">`,
      `        <h1 className="text-3xl font-bold tracking-tight text-stone-900">${blueprint.appName}</h1>`,
      `        <p className="mt-2 text-stone-600">${blueprint.tagline}</p>`,
      `      </header>`,
      `      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">`,
      `        {MODULES.map((mod) => (`,
      `          <Link`,
      `            key={mod.slug}`,
      `            href={\`/\${mod.slug}\`}`,
      `            className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-emerald-800"`,
      `          >`,
      `            <h2 className="text-lg font-semibold text-stone-900">{mod.title}</h2>`,
      `            <p className="mt-1 text-sm text-stone-600">{mod.description}</p>`,
      `          </Link>`,
      `        ))}`,
      `      </section>`,
      `    </main>`,
      `  );`,
      `}`,
      ``,
    ].join('\n'),
  });

  for (const entity of blueprint.entities) {
    files.push(renderEntityCrudPage(entity));
  }

  return files;
}

function renderEntityCrudPage(entity: BlueprintEntity): GeneratedCodeFile {
  const tableFields = entity.fields.filter((f) => f.showInTable).slice(0, 5);
  const initialFormState = entity.fields
    .map((f) => {
      if (f.type === 'boolean') return `    ${f.name}: true,`;
      if (f.type === 'int' || f.type === 'decimal' || f.type === 'currency') return `    ${f.name}: 0,`;
      if (f.type === 'enum' && f.enumValues?.length) return `    ${f.name}: '${f.enumValues[0]}',`;
      return `    ${f.name}: '',`;
    })
    .join('\n');

  const formInputs = entity.fields
    .map((f) => {
      if (f.type === 'boolean') {
        return `              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={Boolean(form.${f.name})} onChange={(e) => setForm({ ...form, ${f.name}: e.target.checked })} />
                ${f.label}
              </label>`;
      }
      if (f.type === 'enum' && f.enumValues?.length) {
        const opts = f.enumValues.map((v) => `<option value="${v}">${v}</option>`).join('');
        return `              <div>
                <label className="mb-1 block text-sm font-medium">${f.label}</label>
                <select className="w-full rounded-lg border px-3 py-2" value={String(form.${f.name} || '')} onChange={(e) => setForm({ ...form, ${f.name}: e.target.value })}>
                  ${opts}
                </select>
              </div>`;
      }
      const inputType =
        f.type === 'int' || f.type === 'decimal' || f.type === 'currency'
          ? 'number'
          : f.type === 'email'
            ? 'email'
            : f.type === 'date'
              ? 'date'
              : 'text';
      return `              <div>
                <label className="mb-1 block text-sm font-medium">${f.label}</label>
                <input type="${inputType}" required={${f.required}} className="w-full rounded-lg border px-3 py-2" value={String(form.${f.name} ?? '')} onChange={(e) => setForm({ ...form, ${f.name}: e.target.value })} />
              </div>`;
    })
    .join('\n');

  const thCols = tableFields.map((f) => `<th className="px-4 py-3 text-left">${f.label}</th>`).join('');
  const tdCols = tableFields
    .map((f) => `<td className="px-4 py-3">{String(row.${f.name} ?? '-')}</td>`)
    .join('');

  return {
    filePath: `frontend/src/app/${entity.slug}/page.tsx`,
    layer: 'FRONTEND',
    language: 'tsx',
    content: [
      `'use client';`,
      ``,
      `import { useCallback, useEffect, useState } from 'react';`,
      `import { toast } from 'sonner';`,
      `import { apiFetch } from '@/lib/api-client';`,
      ``,
      `interface ${entity.name}Record {`,
      `  id: string;`,
      `  [key: string]: unknown;`,
      `}`,
      ``,
      `export default function ${entity.name}Page() {`,
      `  const [items, setItems] = useState<${entity.name}Record[]>([]);`,
      `  const [search, setSearch] = useState('');`,
      `  const [page, setPage] = useState(1);`,
      `  const [totalPages, setTotalPages] = useState(1);`,
      `  const [loading, setLoading] = useState(true);`,
      `  const [openModal, setOpenModal] = useState(false);`,
      `  const [editingId, setEditingId] = useState<string | null>(null);`,
      `  const [deleteId, setDeleteId] = useState<string | null>(null);`,
      `  const [form, setForm] = useState<Record<string, unknown>>({`,
      initialFormState,
      `  });`,
      ``,
      `  const load = useCallback(async () => {`,
      `    setLoading(true);`,
      `    try {`,
      `      const qs = new URLSearchParams({ page: String(page), pageSize: '10', ...(search ? { search } : {}) });`,
      `      const res = await apiFetch<{ data: ${entity.name}Record[]; meta: { totalPages: number } }>(\`/${entity.slug}?\${qs}\`);`,
      `      setItems(res.data);`,
      `      setTotalPages(res.meta.totalPages);`,
      `    } catch (err) {`,
      `      toast.error(err instanceof Error ? err.message : 'Erro ao carregar registros.');`,
      `    } finally {`,
      `      setLoading(false);`,
      `    }`,
      `  }, [page, search]);`,
      ``,
      `  useEffect(() => {`,
      `    load();`,
      `  }, [load]);`,
      ``,
      `  async function handleSave(e: React.FormEvent) {`,
      `    e.preventDefault();`,
      `    try {`,
      `      if (editingId) {`,
      `        await apiFetch(\`/${entity.slug}/\${editingId}\`, { method: 'PATCH', body: JSON.stringify(form) });`,
      `        toast.success('${entity.label} atualizado com sucesso!');`,
      `      } else {`,
      `        await apiFetch('/${entity.slug}', { method: 'POST', body: JSON.stringify(form) });`,
      `        toast.success('${entity.label} criado com sucesso!');`,
      `      }`,
      `      setOpenModal(false);`,
      `      setEditingId(null);`,
      `      load();`,
      `    } catch (err) {`,
      `      toast.error(err instanceof Error ? err.message : 'Falha ao salvar.');`,
      `    }`,
      `  }`,
      ``,
      `  async function confirmDelete() {`,
      `    if (!deleteId) return;`,
      `    try {`,
      `      await apiFetch(\`/${entity.slug}/\${deleteId}\`, { method: 'DELETE' });`,
      `      toast.success('${entity.label} removido.');`,
      `      setDeleteId(null);`,
      `      load();`,
      `    } catch (err) {`,
      `      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');`,
      `    }`,
      `  }`,
      ``,
      `  return (`,
      `    <main className="mx-auto max-w-6xl p-6">`,
      `      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">`,
      `        <div>`,
      `          <h1 className="text-2xl font-bold">${entity.pluralLabel}</h1>`,
      `          <p className="text-sm text-stone-600">${entity.description}</p>`,
      `        </div>`,
      `        <button onClick={() => { setEditingId(null); setOpenModal(true); }} className="rounded-lg bg-emerald-900 px-4 py-2 text-sm font-medium text-white">`,
      `          + Novo ${entity.label}`,
      `        </button>`,
      `      </div>`,
      `      <input`,
      `        value={search}`,
      `        onChange={(e) => { setPage(1); setSearch(e.target.value); }}`,
      `        placeholder="Buscar ${entity.pluralLabel.toLowerCase()}..."`,
      `        className="mb-4 w-full max-w-sm rounded-lg border bg-white px-3 py-2 text-sm"`,
      `      />`,
      `      <div className="overflow-x-auto rounded-xl border bg-white">`,
      `        <table className="w-full text-sm">`,
      `          <thead className="bg-stone-100 text-xs uppercase text-stone-600">`,
      `            <tr>${thCols}<th className="px-4 py-3 text-right">Ações</th></tr>`,
      `          </thead>`,
      `          <tbody>`,
      `            {loading ? (`,
      `              <tr><td colSpan={6} className="p-6 text-center text-stone-500">Carregando...</td></tr>`,
      `            ) : items.length === 0 ? (`,
      `              <tr><td colSpan={6} className="p-6 text-center text-stone-500">Nenhum registro encontrado.</td></tr>`,
      `            ) : (`,
      `              items.map((row) => (`,
      `                <tr key={row.id} className="border-t">`,
      `                  ${tdCols}`,
      `                  <td className="px-4 py-3 text-right space-x-2">`,
      `                    <button onClick={() => { setEditingId(row.id); setForm(row); setOpenModal(true); }} className="text-emerald-800 underline">Editar</button>`,
      `                    <button onClick={() => setDeleteId(row.id)} className="text-red-700 underline">Excluir</button>`,
      `                  </td>`,
      `                </tr>`,
      `              ))`,
      `            )}`,
      `          </tbody>`,
      `        </table>`,
      `      </div>`,
      `      <div className="mt-4 flex items-center justify-between text-sm">`,
      `        <span>Página {page} de {totalPages}</span>`,
      `        <div className="space-x-2">`,
      `          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Anterior</button>`,
      `          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Próxima</button>`,
      `        </div>`,
      `      </div>`,
      `      {openModal && (`,
      `        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">`,
      `          <form onSubmit={handleSave} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6">`,
      `            <h2 className="text-lg font-semibold">{editingId ? 'Editar' : 'Novo'} ${entity.label}</h2>`,
      formInputs,
      `            <div className="flex justify-end gap-2 pt-2">`,
      `              <button type="button" onClick={() => setOpenModal(false)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>`,
      `              <button type="submit" className="rounded-lg bg-emerald-900 px-4 py-2 text-sm text-white">Salvar</button>`,
      `            </div>`,
      `          </form>`,
      `        </div>`,
      `      )}`,
      `      {deleteId && (`,
      `        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">`,
      `          <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6">`,
      `            <h3 className="font-semibold">Confirmar exclusão?</h3>`,
      `            <p className="text-sm text-stone-600">Esta ação removerá o registro da listagem ativa.</p>`,
      `            <div className="flex justify-end gap-2">`,
      `              <button onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>`,
      `              <button onClick={confirmDelete} className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white">Excluir</button>`,
      `            </div>`,
      `          </div>`,
      `        </div>`,
      `      )}`,
      `    </main>`,
      `  );`,
      `}`,
      ``,
    ].join('\n'),
  };
}

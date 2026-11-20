# Fábrica Livre — Software Factory Open-Source

> **Transforme ideias em português simples em sistemas web completos (Banco de Dados, API e Telas) sem precisar saber programar.**

Projeto open-source sob licença **MIT**, construído para democratizar a criação de software profissional para autônomos, pequenos negócios e iniciantes, com suporte nativo às assinaturas de IA que as pessoas já utilizam (**Antigravity**, **ChatGPT**, **Claude**, **Gemini**), além de **Ollama local** e **Motor Automático Offline**.

---

## Principais Recursos

- **Assistente Guiado em 3 Passos:** O usuário descreve o negócio em linguagem simples ou escolhe um modelo pronto (Barbearia, Loja/Estoque, Clínica, Finanças).
- **Simulador Interativo no Navegador:** Permite testar cadastros, busca, edição e exclusão antes de baixar qualquer código.
- **Compatível com Suas Assinaturas de IA (Zero API Key obrigatória):**
  - **Ponte Assistida Web:** Gere um super-prompt pronto com 1 clique para colar na sua assinatura do **Antigravity**, **ChatGPT (Plus/Pro)**, **Claude (Pro/Max)** ou **Google Gemini**, e importe a resposta direto para gerar o software.
  - **CLIs Oficiais Locais:** Integração segura com `claude`, `gemini` e `codex` quando instalados e autenticados localmente.
  - **APIs (BYOK) & Ollama:** Suporte a OpenAI, Anthropic, Google Gemini API e modelos locais via Ollama (chaves criptografadas com AES-256-GCM).
  - **Motor Automático Offline:** Funciona imediatamente sem conta paga nem internet externa.
- **Geração Real de Código Pronto para Produção (`.ZIP`):**
  - `PostgreSQL + Prisma ORM` (`schema.prisma` completo com soft delete e índices)
  - `Backend NestJS + TypeScript` (arquitetura limpa: `dtos`, `repositories`, `services`, `controllers`, JWT + RBAC, Zod e Swagger)
  - `Frontend Next.js App Router + Tailwind CSS v4`
  - `Docker Compose` + `AGENTS.md` + `.antigravity/blueprint.json`

---

## Publicar Online na Nuvem (Deploy Full-Stack)

Como o projeto possui **Frontend + Backend NestJS + PostgreSQL**, você pode publicar tudo online gratuitamente em poucos minutos (veja o guia completo em [DEPLOY.md](./DEPLOY.md)):

- **1-Click Deploy no Render (Banco + API + Site):**  
  https://render.com/deploy?repo=https://github.com/marlonferreira1800-hue/-software-factory
- **Vercel + Railway:** Configurações prontas em [`apps/web/vercel.json`](./apps/web/vercel.json), [`apps/api/railway.toml`](./apps/api/railway.toml) e [`apps/web/railway.toml`](./apps/web/railway.toml).

---

## Como Rodar com Docker (Mais Fácil Localmente)

```bash
cp .env.example .env
docker compose up -d --build
```

Acesse:
- **Aplicação Web:** http://localhost:3000
- **API & Swagger OpenAPI:** http://localhost:3001/api/docs

---

## Como Rodar Localmente para Desenvolvimento

1. Instale as dependências e gere o Prisma Client:
   ```bash
   cp .env.example .env
   npm install
   npm run build:shared
   npm run prisma:generate
   ```
2. Suba apenas o PostgreSQL (ou use um PostgreSQL 15 local) e execute migrations + seed:
   ```bash
   docker compose up -d postgres
   npm run prisma:migrate
   npm run prisma:seed
   ```
3. Inicie Backend e Frontend em dois terminais:
   ```bash
   npm run dev:api
   npm run dev:web
   ```

### Contas Demo (Seed)
- **Criador (BUILDER):** `criador@fabricalivre.org` / `Criador@123`
- **Administrador (ADMIN):** `admin@fabricalivre.org` / `Admin@123`
- **Consulta (VIEWER):** `visitante@fabricalivre.org` / `Visitante@123`

---

## Contribuição Open-Source

Leia [CONTRIBUTING.md](./CONTRIBUTING.md). Pull requests para novos templates setoriais, adaptadores de IA e melhorias de acessibilidade são muito bem-vindos!

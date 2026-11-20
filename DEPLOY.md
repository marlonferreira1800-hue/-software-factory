# Guia de Publicação Online (Deploy Full-Stack)

O **GitHub** guarda todo o seu código e executa testes automáticos via **GitHub Actions** ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)), mas não executa servidores NestJS nem bancos PostgreSQL diretamente.

Por isso, o repositório já vem preparado para você publicar o site completo na nuvem (Frontend + Backend + PostgreSQL real) em poucos minutos.

---

## Opção 1 (Mais Fácil — 1 Clique): Render Blueprint

O arquivo [`render.yaml`](./render.yaml) cria automaticamente:
1. Banco de dados **PostgreSQL gerenciado** (`fabrica-livre-db`)
2. Servidor **Backend NestJS** com migrations + seed automáticos (`fabrica-livre-api`)
3. Site **Frontend Next.js** já conectado ao backend via proxy `/backend` (`fabrica-livre-web`)

### Passo a passo:
1. Crie uma conta gratuita em https://render.com conectada ao seu GitHub.
2. Clique neste link direto ou vá em **New → Blueprint**:
   https://render.com/deploy?repo=https://github.com/marlonferreira1800-hue/-software-factory
3. Dê um nome (ex: `fabrica-livre`) e clique em **Apply**.
4. Aguarde alguns minutos até os 3 serviços ficarem verdes e abra a URL gerada para `fabrica-livre-web`!

---

## Opção 2: Vercel (Frontend) + Render/Railway (Backend + PostgreSQL)

### Passo A — Subir o Banco + Backend no Render ou Railway
- No **Render**, use o [`render.yaml`](./render.yaml) (ou suba apenas `fabrica-livre-api` + `fabrica-livre-db`).
- No **Railway**:
  1. Crie um projeto novo e adicione um banco **PostgreSQL**.
  2. Adicione o serviço **API** apontando para este repositório usando [`apps/api/railway.toml`](./apps/api/railway.toml) e preencha `DATABASE_URL`, `JWT_SECRET` e `ENCRYPTION_SECRET`.

### Passo B — Subir o Frontend na Vercel
1. Acesse https://vercel.com/new e importe `marlonferreira1800-hue/-software-factory`.
2. Em **Root Directory**, selecione `apps/web` (o arquivo [`apps/web/vercel.json`](./apps/web/vercel.json) já configura o build do monorepo).
3. Adicione a variável de ambiente:
   - `NEXT_PUBLIC_API_URL` = URL pública do seu backend (ex: `https://fabrica-livre-api.onrender.com`)
4. Clique em **Deploy**.

---

## Contas Iniciais para Testar no Site Online

Assim que o site subir, o `seed.ts` já cria estas contas prontas (você pode clicar nos botões de preenchimento rápido na tela de Login):
- **Criador (`BUILDER`):** `criador@fabricalivre.org` / `Criador@123`
- **Administrador (`ADMIN`):** `admin@fabricalivre.org` / `Admin@123`
- **Consulta (`VIEWER`):** `visitante@fabricalivre.org` / `Visitante@123`

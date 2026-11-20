# Guia de Publicação Online (GitHub Pages, Vercel, Render e Railway)

## 1. GitHub Pages (Já Ativo e Automático!)

O repositório já publica automaticamente a interface completa rodando 100% no navegador (Assistente, Modelos Prontos, Simulador Interativo, Ponte para Antigravity/ChatGPT/Claude/Gemini e Download `.ZIP`) pelo workflow [`.github/workflows/pages.yml`](./.github/workflows/pages.yml):

- **Link ao vivo:** https://marlonferreira1800-hue.github.io/-software-factory/

---

## 2. Vercel (1 Clique — Frontend)

Clique no link abaixo para publicar na **Vercel** com a pasta `apps/web` já pré-configurada via [`apps/web/vercel.json`](./apps/web/vercel.json):

https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmarlonferreira1800-hue%2F-software-factory&root-directory=apps%2Fweb&project-name=fabrica-livre

> Se você já subiu o Backend no Render, pode adicionar na Vercel a variável `NEXT_PUBLIC_API_URL=https://fabrica-livre-api.onrender.com`. Se não adicionar nenhuma variável, o site na Vercel também funciona automaticamente no Modo Navegador!

---

## 3. Render Blueprint (1 Clique — PostgreSQL + Backend NestJS + Frontend)

O arquivo [`render.yaml`](./render.yaml) cria automaticamente:
1. Banco **PostgreSQL** (`fabrica-livre-db`)
2. Backend **NestJS** (`fabrica-livre-api`)
3. Frontend **Next.js** (`fabrica-livre-web`)

Link direto:
https://render.com/deploy?repo=https://github.com/marlonferreira1800-hue/-software-factory

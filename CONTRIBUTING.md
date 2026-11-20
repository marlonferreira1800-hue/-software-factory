# Contribuindo com a Fábrica Livre

Obrigado por ajudar a tornar a criação de software acessível a qualquer pessoa!

## Arquitetura do Monorepo

- `packages/shared`: Schemas Zod e tipos TypeScript compartilhados entre API e Frontend.
- `apps/api`: Backend NestJS + Prisma ORM + PostgreSQL + JWT + RBAC + Swagger.
- `apps/web`: Frontend Next.js App Router + Tailwind CSS v4 + Shadcn/UI.

## Padrões Obrigatórios para Pull Requests

1. Mantenha a separação modular no backend (`*.dto.ts`, `*.repository.ts`, `*.service.ts`, `*.controller.ts`).
2. Valide toda entrada de dados com Zod em `packages/shared`.
3. Mantenha a linguagem da interface acessível para pessoas sem formação técnica.
4. Execute os testes e builds antes de enviar:
   ```bash
   npm run build
   npm test
   ```

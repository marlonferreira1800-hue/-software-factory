import { AppBlueprint } from '@software-factory/shared';
import { GeneratedCodeFile } from './nestjs-codegen';

export function generateInfraAndAiPack(
  blueprint: AppBlueprint,
  options: { includeDocker: boolean; includeAiPack: boolean },
): GeneratedCodeFile[] {
  const files: GeneratedCodeFile[] = [];

  files.push({
    filePath: 'README.md',
    layer: 'DOCS',
    language: 'markdown',
    content: [
      `# ${blueprint.appName}`,
      ``,
      `> ${blueprint.tagline}`,
      ``,
      `${blueprint.summary}`,
      ``,
      `## Módulos Incluídos`,
      ...blueprint.entities.map(
        (e) => `- **${e.pluralLabel}** (\`/${e.slug}\`): ${e.description}`,
      ),
      ``,
      `## Como Rodar em 3 Passos Simples`,
      `1. Copie \`.env.example\` para \`.env\`.`,
      `2. Suba o banco PostgreSQL e os serviços com Docker:`,
      `   \`\`\`bash`,
      `   docker compose up -d --build`,
      `   \`\`\``,
      `3. Acesse:`,
      `   - Telas do Sistema: http://localhost:3000`,
      `   - Documentação da API (Swagger): http://localhost:3001/api/docs`,
      ``,
      `## Evoluindo com sua Assinatura de IA`,
      `Este pacote já inclui \`AGENTS.md\` e \`.antigravity/blueprint.json\`, prontos para você abrir no **Antigravity**, **Claude Code**, **Codex CLI**, **Gemini CLI** ou colar no **ChatGPT / Claude / Gemini** e pedir novas funcionalidades!`,
      ``,
    ].join('\n'),
  });

  files.push({
    filePath: '.env.example',
    layer: 'INFRA',
    language: 'dotenv',
    content: [
      `DATABASE_URL="postgresql://appuser:appsecret@postgres:5432/${blueprint.slug.replace(/-/g, '_')}?schema=public"`,
      `JWT_SECRET="troque-esta-chave-secreta-antes-de-publicar"`,
      `PORT=3001`,
      `CORS_ORIGIN="http://localhost:3000"`,
      `NEXT_PUBLIC_API_URL="http://localhost:3001/api"`,
      ``,
    ].join('\n'),
  });

  if (options.includeDocker) {
    files.push({
      filePath: 'docker-compose.yml',
      layer: 'INFRA',
      language: 'yaml',
      content: [
        `services:`,
        `  postgres:`,
        `    image: postgres:15-alpine`,
        `    environment:`,
        `      POSTGRES_USER: appuser`,
        `      POSTGRES_PASSWORD: appsecret`,
        `      POSTGRES_DB: ${blueprint.slug.replace(/-/g, '_')}`,
        `    ports:`,
        `      - "5432:5432"`,
        `    volumes:`,
        `      - pgdata:/var/lib/postgresql/data`,
        ``,
        `  backend:`,
        `    image: node:22-alpine`,
        `    working_dir: /app`,
        `    volumes:`,
        `      - ./backend:/app`,
        `    environment:`,
        `      DATABASE_URL: "postgresql://appuser:appsecret@postgres:5432/${blueprint.slug.replace(/-/g, '_')}?schema=public"`,
        `      PORT: "3001"`,
        `    ports:`,
        `      - "3001:3001"`,
        `    depends_on:`,
        `      - postgres`,
        `    command: sh -c "npm install && npx prisma migrate deploy && npm run build && npm run start"`,
        ``,
        `  frontend:`,
        `    image: node:22-alpine`,
        `    working_dir: /app`,
        `    volumes:`,
        `      - ./frontend:/app`,
        `    environment:`,
        `      NEXT_PUBLIC_API_URL: "http://localhost:3001/api"`,
        `    ports:`,
        `      - "3000:3000"`,
        `    depends_on:`,
        `      - backend`,
        `    command: sh -c "npm install && npm run build && npm run start"`,
        ``,
        `volumes:`,
        `  pgdata:`,
        ``,
      ].join('\n'),
    });
  }

  if (options.includeAiPack) {
    files.push({
      filePath: 'AGENTS.md',
      layer: 'AI_PACK',
      language: 'markdown',
      content: [
        `# Guia para Agentes de IA — ${blueprint.appName}`,
        ``,
        `Este projeto foi gerado pela plataforma open-source **Fábrica Livre**.`,
        `Qualquer agente ou assinatura de IA (**Antigravity**, **Claude Code**, **Codex CLI**, **Gemini CLI**, **ChatGPT**) deve seguir estes padrões:`,
        ``,
        `- **Backend**: NestJS + Prisma + PostgreSQL + Zod + JWT/RBAC em \`backend/src/modules/<entidade>/\`.`,
        `- **Frontend**: Next.js App Router + Tailwind CSS v4 em \`frontend/src/app/<entidade>/page.tsx\`.`,
        `- **Arquitetura**: Sempre mantenha \`dto.ts\`, \`repository.ts\`, \`service.ts\` e \`controller.ts\` separados.`,
        `- **Validação**: Nunca remova schemas Zod ou confirmações de exclusão na interface.`,
        ``,
        `Consulte \`.antigravity/blueprint.json\` para a especificação estruturada de entidades e regras de negócio.`,
        ``,
      ].join('\n'),
    });

    files.push({
      filePath: '.antigravity/blueprint.json',
      layer: 'AI_PACK',
      language: 'json',
      content: JSON.stringify(blueprint, null, 2),
    });

    files.push({
      filePath: '.antigravity/prompts.md',
      layer: 'AI_PACK',
      language: 'markdown',
      content: [
        `# Prompts Prontos para Evoluir seu Sistema com Sua Assinatura de IA`,
        ``,
        `Use qualquer um dos pedidos abaixo no **Antigravity**, **ChatGPT**, **Claude** ou **Gemini**:`,
        ``,
        `### 1. Adicionar Relatório em PDF ou Excel`,
        `> "Leia o arquivo AGENTS.md e .antigravity/blueprint.json e adicione um botão de Exportar CSV na tabela de ${blueprint.entities[0]?.pluralLabel || 'registros'}."`,
        ``,
        `### 2. Criar Notificação por WhatsApp / E-mail`,
        `> "Com base em ${blueprint.entities[0]?.name || 'Item'}, adicione um serviço de lembrete automático sempre que um novo registro for criado."`,
        ``,
        `### 3. Personalizar Visual da Marca`,
        `> "Atualize o tema de cores em frontend/src/app/globals.css para combinar com a identidade visual da minha empresa mantendo acessibilidade."`,
        ``,
      ].join('\n'),
    });
  }

  return files;
}

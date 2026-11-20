import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AppBlueprint,
  AppBlueprintSchema,
  TargetAiPlatform,
} from '@software-factory/shared';

const PLATFORM_META: Record<
  TargetAiPlatform,
  { launchUrl: string; instructions: string; label: string }
> = {
  ANTIGRAVITY: {
    label: 'Antigravity',
    launchUrl: 'https://antigravity.google',
    instructions:
      '1) Clique em "Copiar Pedido Estruturado". 2) Cole no seu chat/agente do Antigravity com sua conta ativa. 3) Copie o bloco JSON gerado pelo Antigravity e cole na caixa abaixo para nossa fábrica construir todo o sistema.',
  },
  CHATGPT: {
    label: 'ChatGPT (Plus / Pro)',
    launchUrl: 'https://chatgpt.com',
    instructions:
      '1) Copie o pedido abaixo. 2) Abra o ChatGPT (usando sua assinatura normalmente, sem precisar de chave API) e cole a mensagem. 3) Copie a resposta JSON e cole abaixo.',
  },
  CLAUDE: {
    label: 'Claude (Pro / Max)',
    launchUrl: 'https://claude.ai',
    instructions:
      '1) Copie o pedido abaixo. 2) Cole no Claude.ai com sua assinatura ativa. 3) Copie o JSON retornado pelo Claude e cole abaixo para gerar banco, API e telas.',
  },
  GEMINI: {
    label: 'Google Gemini (Advanced / Pro)',
    launchUrl: 'https://gemini.google.com',
    instructions:
      '1) Copie o pedido abaixo. 2) Cole no Google Gemini com sua assinatura Google AI. 3) Copie o JSON devolvido pelo Gemini e cole abaixo.',
  },
  GENERIC: {
    label: 'Qualquer IA (ChatGPT / Claude / Gemini / Antigravity)',
    launchUrl: 'https://chatgpt.com',
    instructions:
      '1) Copie o pedido abaixo. 2) Cole em qualquer chat de IA da sua preferência. 3) Cole o JSON retornado abaixo.',
  },
};

@Injectable()
export class SubscriptionBridgeAdapter {
  buildHandoffPrompt(params: {
    projectName: string;
    userPrompt: string;
    targetPlatform: TargetAiPlatform;
  }): {
    targetPlatform: TargetAiPlatform;
    launchUrl: string;
    platformInstructions: string;
    superPrompt: string;
  } {
    const meta = PLATFORM_META[params.targetPlatform] || PLATFORM_META.GENERIC;
    const superPrompt = [
      `Atue como Arquiteto de Software da Fábrica Livre. Gere EXCLUSIVAMENTE um JSON válido (sem comentários fora do JSON) seguindo exatamente a estrutura abaixo para o sistema descrito pelo usuário.`,
      ``,
      `NOME DO PROJETO: ${params.projectName}`,
      `PEDIDO DO USUÁRIO: ${params.userPrompt}`,
      ``,
      `REGRAS DO JSON (obrigatório):`,
      `- Retorne um objeto JSON com as chaves: "appName", "slug" (minúsculo com hífens), "tagline", "summary", "targetAudience", "primaryColor" ("#1B4332"), "roles", "entities", "workflows".`,
      `- Cada item em "entities" deve conter:`,
      `  - "name": PascalCase em português sem acentos (ex: "Cliente", "Agendamento")`,
      `  - "slug": kebab-case plural (ex: "clientes", "agendamentos")`,
      `  - "label": singular amigável (ex: "Cliente")`,
      `  - "pluralLabel": plural amigável (ex: "Clientes")`,
      `  - "description": descrição clara para leigos`,
      `  - "icon": um entre ["Users","Briefcase","CalendarClock","Package","ShoppingBag","Wallet","Truck","UserCheck","ClipboardList","CheckSquare"]`,
      `  - "softDelete": true`,
      `  - "readRoles": ["ADMIN","BUILDER","VIEWER"]`,
      `  - "writeRoles": ["ADMIN","BUILDER"]`,
      `  - "fields": array com pelo menos 2 campos. Cada campo tem: "name" (camelCase sem acento), "label" (rótulo amigável PT-BR), "type" (UM DE: "string","text","int","decimal","boolean","date","datetime","email","phone","currency","enum"), "required" (boolean), "unique" (boolean), "searchable" (boolean), "showInTable" (boolean), e "enumValues" (array de strings MAIÚSCULAS apenas se type=="enum").`,
      ``,
      `EXEMPLO DE SAÍDA ESPERADA:`,
      `{`,
      `  "appName": "Agenda Bela Corte",`,
      `  "slug": "agenda-bela-corte",`,
      `  "tagline": "Controle simples de clientes, serviços e horários",`,
      `  "summary": "Sistema completo para gerenciar agendamentos e atendimentos diários.",`,
      `  "targetAudience": "Salões e barbearias",`,
      `  "primaryColor": "#1B4332",`,
      `  "roles": [`,
      `    { "key": "ADMIN", "label": "Administrador", "description": "Controle total" },`,
      `    { "key": "BUILDER", "label": "Equipe", "description": "Atendimento diário" }`,
      `  ],`,
      `  "entities": [`,
      `    {`,
      `      "name": "Cliente",`,
      `      "slug": "clientes",`,
      `      "label": "Cliente",`,
      `      "pluralLabel": "Clientes",`,
      `      "description": "Cadastro de clientes e telefone",`,
      `      "icon": "Users",`,
      `      "softDelete": true,`,
      `      "readRoles": ["ADMIN","BUILDER","VIEWER"],`,
      `      "writeRoles": ["ADMIN","BUILDER"],`,
      `      "fields": [`,
      `        { "name": "nome", "label": "Nome", "type": "string", "required": true, "unique": false, "searchable": true, "showInTable": true },`,
      `        { "name": "telefone", "label": "WhatsApp", "type": "phone", "required": true, "unique": false, "searchable": true, "showInTable": true }`,
      `      ]`,
      `    }`,
      `  ],`,
      `  "workflows": [`,
      `    { "name": "Confirmação de Horário", "trigger": "Novo agendamento salvo", "action": "Exibe resumo pronto para enviar no WhatsApp" }`,
      `  ]`,
      `}`,
      ``,
      `Responda SOMENTE com o JSON final dentro de \`\`\`json ... \`\`\`.`,
    ].join('\n');

    return {
      targetPlatform: params.targetPlatform,
      launchUrl: meta.launchUrl,
      platformInstructions: meta.instructions,
      superPrompt,
    };
  }

  parseBlueprintFromAiText(rawText: string): AppBlueprint {
    const jsonString = this.extractJsonBlock(rawText);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new BadRequestException(
        'Não foi possível ler o JSON enviado pela IA. Certifique-se de colar a resposta completa contendo { "appName": ... }.',
      );
    }

    const validation = AppBlueprintSchema.safeParse(parsed);
    if (!validation.success) {
      const details = validation.error.errors.map(
        (issue) => `${issue.path.join('.') || 'blueprint'}: ${issue.message}`,
      );
      throw new BadRequestException({
        message: 'A resposta da IA veio com alguns campos fora do padrão esperado.',
        details,
      });
    }

    return validation.data;
  }

  private extractJsonBlock(rawText: string): string {
    const trimmed = rawText.trim();
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      return fenceMatch[1].trim();
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace, lastBrace + 1);
    }

    return trimmed;
  }
}

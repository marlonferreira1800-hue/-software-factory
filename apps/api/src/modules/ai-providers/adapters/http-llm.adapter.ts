import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AiTestConnectionResult,
  ResolvedProviderConfig,
} from './ai-adapter.interface';

@Injectable()
export class HttpLlmAdapter {
  async testConnection(config: ResolvedProviderConfig): Promise<AiTestConnectionResult> {
    if (config.providerType === 'OLLAMA_LOCAL') {
      const baseUrl = (config.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
      try {
        const res = await fetch(`${baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          return {
            success: false,
            message: `Ollama respondeu com status ${res.status}.`,
          };
        }
        const data = (await res.json()) as { models?: Array<{ name: string }> };
        const names = (data.models || []).slice(0, 4).map((m) => m.name).join(', ');
        return {
          success: true,
          message: 'Servidor Ollama conectado com sucesso.',
          details: names ? `Modelos disponíveis: ${names}` : 'Nenhum modelo baixado ainda.',
        };
      } catch {
        return {
          success: false,
          message: `Não foi possível alcançar o Ollama em ${baseUrl}.`,
          details: 'Verifique se o Ollama está aberto rodando localmente na porta 11434.',
        };
      }
    }

    if (!config.apiKey) {
      return {
        success: false,
        message: 'Nenhuma chave de API configurada neste conector.',
        details: 'Informe a chave API ou use um conector de Assinatura Web sem chave.',
      };
    }

    if (config.providerType === 'OPENAI_API' || config.providerType === 'OPENAI_COMPATIBLE') {
      const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
      try {
        const res = await fetch(`${baseUrl}/models`, {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: AbortSignal.timeout(8000),
        });
        return res.ok
          ? { success: true, message: 'Chave validada com sucesso no endpoint OpenAI.' }
          : { success: false, message: `Endpoint retornou HTTP ${res.status}. Verifique a chave ou URL.` };
      } catch (err) {
        return {
          success: false,
          message: 'Falha de rede ao testar endpoint OpenAI.',
          details: err instanceof Error ? err.message : undefined,
        };
      }
    }

    if (config.providerType === 'ANTHROPIC_API') {
      try {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          signal: AbortSignal.timeout(8000),
        });
        return res.ok
          ? { success: true, message: 'Chave Anthropic Claude validada com sucesso.' }
          : { success: false, message: `Anthropic retornou HTTP ${res.status}.` };
      } catch (err) {
        return {
          success: false,
          message: 'Falha ao conectar à API da Anthropic.',
          details: err instanceof Error ? err.message : undefined,
        };
      }
    }

    if (config.providerType === 'GEMINI_API') {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(config.apiKey)}`,
          { signal: AbortSignal.timeout(8000) },
        );
        return res.ok
          ? { success: true, message: 'Chave Google Gemini API validada com sucesso.' }
          : { success: false, message: `Google Gemini retornou HTTP ${res.status}.` };
      } catch (err) {
        return {
          success: false,
          message: 'Falha ao conectar à API do Google Gemini.',
          details: err instanceof Error ? err.message : undefined,
        };
      }
    }

    return { success: false, message: 'Tipo de provedor HTTP não reconhecido.' };
  }

  async runPrompt(config: ResolvedProviderConfig, prompt: string): Promise<string> {
    if (config.providerType === 'OLLAMA_LOCAL') {
      const baseUrl = (config.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
      const model = config.modelName || 'llama3.1';
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        throw new BadRequestException(`Ollama retornou erro HTTP ${res.status}.`);
      }
      const data = (await res.json()) as { message?: { content?: string } };
      return data.message?.content || '';
    }

    if (!config.apiKey) {
      throw new BadRequestException(
        'Este conector exige uma chave de API válida. Configure-a ou troque para o Motor Offline / Ponte de Assinatura.',
      );
    }

    if (config.providerType === 'OPENAI_API' || config.providerType === 'OPENAI_COMPATIBLE') {
      const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
      const model = config.modelName || 'gpt-4o-mini';
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        throw new BadRequestException(`Provedor OpenAI retornou erro HTTP ${res.status}.`);
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content || '';
    }

    if (config.providerType === 'ANTHROPIC_API') {
      const model = config.modelName || 'claude-3-7-sonnet-latest';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        throw new BadRequestException(`Anthropic Claude retornou erro HTTP ${res.status}.`);
      }
      const data = (await res.json()) as { content?: Array<{ text?: string }> };
      return data.content?.[0]?.text || '';
    }

    if (config.providerType === 'GEMINI_API') {
      const model = config.modelName || 'gemini-2.5-flash';
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
          signal: AbortSignal.timeout(45000),
        },
      );
      if (!res.ok) {
        throw new BadRequestException(`Google Gemini retornou erro HTTP ${res.status}.`);
      }
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    throw new BadRequestException('Tipo de provedor HTTP não suportado.');
  }
}

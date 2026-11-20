import { BadRequestException, Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { AiProviderType } from '@software-factory/shared';
import { AiTestConnectionResult } from './ai-adapter.interface';

const execFileAsync = promisify(execFile);

const ALLOWED_CLI_BINARIES: Partial<Record<AiProviderType, string>> = {
  CLAUDE_CLI: 'claude',
  GEMINI_CLI: 'gemini',
  CODEX_CLI: 'codex',
};

@Injectable()
export class LocalCliAdapter {
  async testCliAvailability(providerType: AiProviderType): Promise<AiTestConnectionResult> {
    const binary = ALLOWED_CLI_BINARIES[providerType];
    if (!binary) {
      return {
        success: false,
        message: 'Este tipo de conector não usa CLI local.',
      };
    }

    try {
      const { stdout } = await execFileAsync(binary, ['--version'], {
        timeout: 5000,
        shell: false,
      });
      return {
        success: true,
        message: `CLI oficial "${binary}" detectado e pronto para usar sua assinatura local.`,
        details: stdout.trim().slice(0, 160),
      };
    } catch {
      return {
        success: false,
        message: `O executável "${binary}" não está instalado neste servidor.`,
        details:
          'Instale e faça login no CLI oficial na máquina onde o servidor roda, ou use o conector "Assinatura Web (Ponte Guiada)" sem instalar nada.',
      };
    }
  }

  async runPrompt(providerType: AiProviderType, prompt: string): Promise<string> {
    const binary = ALLOWED_CLI_BINARIES[providerType];
    if (!binary) {
      throw new BadRequestException('Provedor CLI inválido.');
    }

    const args =
      providerType === 'CODEX_CLI'
        ? ['exec', prompt]
        : providerType === 'CLAUDE_CLI'
          ? ['-p', prompt, '--output-format', 'text']
          : ['-p', prompt];

    try {
      const { stdout, stderr } = await execFileAsync(binary, args, {
        timeout: 60000,
        maxBuffer: 2 * 1024 * 1024,
        shell: false,
      });
      const output = stdout.trim();
      if (!output) {
        throw new Error(stderr || 'CLI retornou resposta vazia.');
      }
      return output;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Falha ao executar CLI "${binary}" com sua assinatura local: ${errMsg}. Dica: você pode usar o modo Ponte de Assinatura Web a qualquer momento.`,
      );
    }
  }
}

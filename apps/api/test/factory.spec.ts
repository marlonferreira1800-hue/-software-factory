import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { z } from 'zod';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { ZodValidationPipe } from '../src/common/pipes/zod-validation.pipe';
import { BuiltinOfflineAdapter } from '../src/modules/ai-providers/adapters/builtin-offline.adapter';
import { SubscriptionBridgeAdapter } from '../src/modules/ai-providers/adapters/subscription-bridge.adapter';
import { CodeFactoryEngine } from '../src/modules/generator/codegen/code-factory.engine';

describe('Fábrica Livre — Core Software Factory Tests', () => {
  const builtinAdapter = new BuiltinOfflineAdapter();
  const bridgeAdapter = new SubscriptionBridgeAdapter();
  const codeFactory = new CodeFactoryEngine();

  describe('BuiltinOfflineAdapter', () => {
    it('gera blueprint válido em português para barbearia sem chaves externas', () => {
      const blueprint = builtinAdapter.generateFromPrompt({
        projectName: 'Barbearia Central',
        prompt: 'Quero cadastrar clientes, serviços e controlar agendamentos da minha barbearia.',
        targetAudience: 'Barbeiros',
      });

      expect(blueprint.appName).toBe('Barbearia Central');
      expect(blueprint.entities.length).toBeGreaterThanOrEqual(2);
      const slugs = blueprint.entities.map((e) => e.slug);
      expect(slugs).toContain('clientes');
      expect(slugs).toContain('agendamentos');
    });

    it('adapta nomenclatura para clínica de saúde quando usuário menciona pacientes', () => {
      const blueprint = builtinAdapter.generateFromPrompt({
        projectName: 'Clínica Vida',
        prompt: 'Sistema para clínica cadastrar pacientes e consultas médicas.',
      });

      const slugs = blueprint.entities.map((e) => e.slug);
      expect(slugs).toContain('pacientes');
    });
  });

  describe('SubscriptionBridgeAdapter (Antigravity / ChatGPT / Claude / Gemini)', () => {
    it('gera super-prompt estruturado com instruções e URL oficial para a plataforma escolhida', () => {
      const pkg = bridgeAdapter.buildHandoffPrompt({
        projectName: 'Padaria Sabor',
        userPrompt: 'Controlar encomendas e produtos.',
        targetPlatform: 'ANTIGRAVITY',
      });

      expect(pkg.superPrompt).toContain('Padaria Sabor');
      expect(pkg.superPrompt).toContain('"entities"');
      expect(pkg.launchUrl).toContain('antigravity');
      expect(pkg.platformInstructions).toContain('Antigravity');
    });

    it('importa JSON envolvido em cercas markdown e texto explicativo ao redor', () => {
      const blueprint = builtinAdapter.generateFromPrompt({
        projectName: 'Loja Teste',
        prompt: 'Controlar produtos e pedidos.',
      });

      const messyAiReply = `Aqui está a arquitetura solicitada:\n\n\`\`\`json\n${JSON.stringify(blueprint, null, 2)}\n\`\`\`\n\nEspero que ajude!`;
      const parsed = bridgeAdapter.parseBlueprintFromAiText(messyAiReply);

      expect(parsed.appName).toBe('Loja Teste');
      expect(parsed.entities.length).toBeGreaterThanOrEqual(2);
    });

    it('rejeita JSON inválido com BadRequestException amigável', () => {
      expect(() => bridgeAdapter.parseBlueprintFromAiText('texto sem json valido')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('CodeFactoryEngine', () => {
    it('gera schema.prisma, módulos NestJS, telas Next.js, Docker e pacote Antigravity e cria ZIP válido', async () => {
      const blueprint = builtinAdapter.generateFromPrompt({
        projectName: 'Oficina Express',
        prompt: 'Quero controlar clientes, veículos e lançamentos financeiros.',
      });

      const files = codeFactory.generateAllFiles(blueprint, {
        includeDocker: true,
        includeAiPack: true,
      });

      const paths = files.map((f) => f.filePath);
      expect(paths).toContain('backend/prisma/schema.prisma');
      expect(paths).toContain('backend/src/main.ts');
      expect(paths).toContain('docker-compose.yml');
      expect(paths).toContain('AGENTS.md');
      expect(paths).toContain('.antigravity/blueprint.json');
      expect(paths.some((p) => p.endsWith('.controller.ts'))).toBe(true);
      expect(paths.some((p) => p.startsWith('frontend/src/app/') && p.endsWith('/page.tsx'))).toBe(true);

      const zipBuffer = await codeFactory.createZipArchive(
        files.map((f) => ({ filePath: f.filePath, content: f.content })),
        blueprint.slug,
      );
      expect(zipBuffer.length).toBeGreaterThan(2000);
      // Assinatura padrão PK de arquivos ZIP
      expect(zipBuffer.subarray(0, 2).toString('utf8')).toBe('PK');
    });
  });

  describe('ZodValidationPipe & RolesGuard (RBAC)', () => {
    it('valida payloads com Zod e formata erros com clareza', () => {
      const pipe = new ZodValidationPipe(z.object({ email: z.string().email('Email inválido') }));
      expect(pipe.transform({ email: 'ana@teste.com' })).toEqual({ email: 'ana@teste.com' });
      expect(() => pipe.transform({ email: 'invalido' })).toThrow(BadRequestException);
    });

    it('bloqueia usuário VIEWER em rotas exclusivas de ADMIN ou BUILDER', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['ADMIN', 'BUILDER']),
      } as unknown as Reflector;

      const guard = new RolesGuard(reflector);
      const mockCtx = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'u1', role: 'VIEWER' } }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockCtx)).toThrow(ForbiddenException);
    });
  });
});

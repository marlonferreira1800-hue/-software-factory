import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async createUserWithDefaultConnectors(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<User> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          role: data.role,
          isActive: true,
        },
      });

      await tx.aiProviderConnection.createMany({
        data: [
          {
            name: 'Motor Automático Offline (Zero Configuração)',
            slug: 'motor-automatico-offline',
            providerType: 'BUILTIN_OFFLINE',
            authMode: 'NONE',
            subscriptionBrand: 'Fábrica Livre',
            description:
              'Gera sistemas completos instantaneamente em português sem precisar de conta paga ou chave de API.',
            modelName: 'fabrica-nlp-ptbr-v1',
            isDefault: true,
            isActive: true,
            lastTestStatus: 'Pronto para uso imediato',
            ownerId: user.id,
          },
          {
            name: 'Antigravity (Agente & Ponte Guiada)',
            slug: 'antigravity-bridge',
            providerType: 'ANTIGRAVITY_AGENT',
            authMode: 'BROWSER_HANDOFF',
            subscriptionBrand: 'Antigravity',
            description:
              'Gera pacote compatível com Antigravity (prompt estruturado + AGENTS.md + blueprint) usando sua assinatura.',
            modelName: 'antigravity-workspace',
            isDefault: false,
            isActive: true,
            lastTestStatus: 'Modo Ponte Assistida ativo',
            ownerId: user.id,
          },
          {
            name: 'ChatGPT (Minha Assinatura Plus / Pro)',
            slug: 'chatgpt-assinatura',
            providerType: 'SUBSCRIPTION_BRIDGE',
            authMode: 'BROWSER_HANDOFF',
            subscriptionBrand: 'ChatGPT',
            description:
              'Use sua assinatura do ChatGPT sem pagar API extra: copie o pedido guiado, cole no chat e importe o resultado.',
            modelName: 'chatgpt-web-bridge',
            baseUrl: 'https://chatgpt.com',
            isDefault: false,
            isActive: true,
            lastTestStatus: 'Modo Assinatura Web ativo',
            ownerId: user.id,
          },
          {
            name: 'Claude (Minha Assinatura Pro / Max)',
            slug: 'claude-assinatura',
            providerType: 'SUBSCRIPTION_BRIDGE',
            authMode: 'BROWSER_HANDOFF',
            subscriptionBrand: 'Claude',
            description:
              'Use sua assinatura do Claude.ai ou Claude Code para modelar o sistema com zero configuração técnica.',
            modelName: 'claude-web-bridge',
            baseUrl: 'https://claude.ai',
            isDefault: false,
            isActive: true,
            lastTestStatus: 'Modo Assinatura Web ativo',
            ownerId: user.id,
          },
          {
            name: 'Gemini (Minha Assinatura Google AI)',
            slug: 'gemini-assinatura',
            providerType: 'SUBSCRIPTION_BRIDGE',
            authMode: 'BROWSER_HANDOFF',
            subscriptionBrand: 'Gemini',
            description:
              'Use sua conta Google Gemini no navegador ou Gemini CLI para desenhar telas e bancos de dados.',
            modelName: 'gemini-web-bridge',
            baseUrl: 'https://gemini.google.com',
            isDefault: false,
            isActive: true,
            lastTestStatus: 'Modo Assinatura Web ativo',
            ownerId: user.id,
          },
        ],
      });

      return user;
    });
  }
}

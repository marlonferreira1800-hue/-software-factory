import { Module } from '@nestjs/common';
import { BuiltinOfflineAdapter } from './adapters/builtin-offline.adapter';
import { HttpLlmAdapter } from './adapters/http-llm.adapter';
import { LocalCliAdapter } from './adapters/local-cli.adapter';
import { SubscriptionBridgeAdapter } from './adapters/subscription-bridge.adapter';
import { AiProvidersController } from './ai-providers.controller';
import { AiProvidersRepository } from './ai-providers.repository';
import { AiProvidersService } from './ai-providers.service';

@Module({
  controllers: [AiProvidersController],
  providers: [
    AiProvidersService,
    AiProvidersRepository,
    BuiltinOfflineAdapter,
    SubscriptionBridgeAdapter,
    LocalCliAdapter,
    HttpLlmAdapter,
  ],
  exports: [
    AiProvidersService,
    BuiltinOfflineAdapter,
    SubscriptionBridgeAdapter,
    LocalCliAdapter,
    HttpLlmAdapter,
  ],
})
export class AiProvidersModule {}

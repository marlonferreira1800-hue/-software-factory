import { AiProviderAuthMode, AiProviderType, AppBlueprint } from '@software-factory/shared';

export interface ResolvedProviderConfig {
  id: string;
  name: string;
  providerType: AiProviderType;
  authMode: AiProviderAuthMode;
  subscriptionBrand: string;
  modelName?: string | null;
  baseUrl?: string | null;
  cliCommand?: string | null;
  apiKey?: string | null;
}

export interface AiGenerationResult {
  blueprint: AppBlueprint;
  rawResponse: string;
  mode: 'AUTOMATIC_ENGINE' | 'SUBSCRIPTION_HANDOFF' | 'LOCAL_CLI' | 'API_DIRECT';
  summaryMessage: string;
}

export interface AiTestConnectionResult {
  success: boolean;
  message: string;
  details?: string;
}

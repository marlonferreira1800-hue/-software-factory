import {
  AiConnectionTestResult,
  AiProviderQueryDto,
  AiProviderResponse,
  CreateAiProviderDto,
  PaginatedResult,
  UpdateAiProviderDto,
} from '@software-factory/shared';
import { apiRequest } from '@/lib/api-client';

export const aiProvidersService = {
  list: (query: Partial<AiProviderQueryDto> = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    if (query.search) params.set('search', query.search);
    if (query.providerType) params.set('providerType', query.providerType);
    if (query.authMode) params.set('authMode', query.authMode);
    return apiRequest<PaginatedResult<AiProviderResponse>>(
      `/ai-providers?${params.toString()}`,
    );
  },

  create: (dto: CreateAiProviderDto) =>
    apiRequest<AiProviderResponse>('/ai-providers', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateAiProviderDto) =>
    apiRequest<AiProviderResponse>(`/ai-providers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  testConnection: (id: string) =>
    apiRequest<AiConnectionTestResult>(`/ai-providers/${id}/test`, {
      method: 'POST',
    }),

  remove: (id: string) =>
    apiRequest<{ deleted: true; id: string }>(`/ai-providers/${id}`, {
      method: 'DELETE',
    }),
};

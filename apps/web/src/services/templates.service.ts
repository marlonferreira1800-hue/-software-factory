import {
  AppTemplateResponse,
  CreateTemplateDto,
  PaginatedResult,
  TemplateQueryDto,
  UpdateTemplateDto,
} from '@software-factory/shared';
import { apiRequest } from '@/lib/api-client';

export const templatesService = {
  list: (query: Partial<TemplateQueryDto> = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    if (query.search) params.set('search', query.search);
    if (query.category) params.set('category', query.category);
    return apiRequest<PaginatedResult<AppTemplateResponse>>(
      `/templates?${params.toString()}`,
    );
  },

  getById: (id: string) => apiRequest<AppTemplateResponse>(`/templates/${id}`),

  create: (dto: CreateTemplateDto) =>
    apiRequest<AppTemplateResponse>('/templates', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateTemplateDto) =>
    apiRequest<AppTemplateResponse>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  remove: (id: string) =>
    apiRequest<{ deleted: true; id: string }>(`/templates/${id}`, {
      method: 'DELETE',
    }),
};

import {
  CreateProjectDto,
  PaginatedResult,
  ProjectQueryDto,
  SoftwareProjectResponse,
  UpdateProjectDto,
} from '@software-factory/shared';
import { apiRequest } from '@/lib/api-client';

export const projectsService = {
  list: (query: Partial<ProjectQueryDto> = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);
    return apiRequest<PaginatedResult<SoftwareProjectResponse>>(
      `/projects?${params.toString()}`,
    );
  },

  getById: (id: string) => apiRequest<SoftwareProjectResponse>(`/projects/${id}`),

  create: (dto: CreateProjectDto) =>
    apiRequest<SoftwareProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateProjectDto) =>
    apiRequest<SoftwareProjectResponse>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  remove: (id: string) =>
    apiRequest<{ deleted: true; id: string }>(`/projects/${id}`, {
      method: 'DELETE',
    }),
};

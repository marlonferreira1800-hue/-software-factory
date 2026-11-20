import {
  CreateUserDto,
  PaginatedResult,
  UpdateUserDto,
  UserQueryDto,
  UserResponse,
} from '@software-factory/shared';
import { apiRequest } from '@/lib/api-client';

export const usersService = {
  list: (query: Partial<UserQueryDto> = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    if (query.search) params.set('search', query.search);
    if (query.role) params.set('role', query.role);
    return apiRequest<PaginatedResult<UserResponse>>(`/users?${params.toString()}`);
  },

  create: (dto: CreateUserDto) =>
    apiRequest<UserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateUserDto) =>
    apiRequest<UserResponse>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  remove: (id: string) =>
    apiRequest<{ deleted: true; id: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

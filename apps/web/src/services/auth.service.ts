import {
  AuthTokenResponse,
  LoginDto,
  RegisterDto,
  UserResponse,
} from '@software-factory/shared';
import { apiRequest } from '@/lib/api-client';

export const authService = {
  login: (dto: LoginDto) =>
    apiRequest<AuthTokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  register: (dto: RegisterDto) =>
    apiRequest<AuthTokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  getProfile: () => apiRequest<UserResponse>('/auth/me'),
};

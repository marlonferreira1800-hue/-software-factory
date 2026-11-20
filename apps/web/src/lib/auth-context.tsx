'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { LoginDto, RegisterDto, UserResponse, UserRole } from '@software-factory/shared';
import {
  getStoredToken,
  isBrowserOnlyMode,
  setStoredToken,
} from './api-client';
import { authService } from '@/services/auth.service';

interface AuthContextValue {
  user: UserResponse | null;
  loading: boolean;
  login: (dto: LoginDto) => Promise<UserResponse>;
  register: (dto: RegisterDto) => Promise<UserResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token && !isBrowserOnlyMode()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void refreshUser();
    });
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = useCallback(async (dto: LoginDto): Promise<UserResponse> => {
    const res = await authService.login(dto);
    setStoredToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (dto: RegisterDto): Promise<UserResponse> => {
    const res = await authService.register(dto);
    setStoredToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return ctx;
}

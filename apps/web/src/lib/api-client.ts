import {
  browserFactoryDownloadZip,
  browserFactoryRequest,
} from './browser-factory';

export function isBrowserOnlyMode(): boolean {
  if (process.env.NEXT_PUBLIC_STATIC_DEMO === 'true') {
    return true;
  }
  if (
    !process.env.NEXT_PUBLIC_API_URL?.trim() &&
    typeof window !== 'undefined' &&
    (window.location.hostname.endsWith('.github.io') ||
      window.location.hostname.endsWith('.vercel.app'))
  ) {
    return true;
  }
  return false;
}

function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '') + '/api';
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:3001/api';
  }
  return '/backend';
}

export const API_BASE_URL = resolveApiBaseUrl();

export class ApiClientError extends Error {
  statusCode: number;
  details?: string[];

  constructor(message: string, statusCode: number, details?: string[]) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (isBrowserOnlyMode()) return 'browser-demo-jwt';
  return window.localStorage.getItem('fabrica_livre_token');
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem('fabrica_livre_token', token);
  } else {
    window.localStorage.removeItem('fabrica_livre_token');
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (isBrowserOnlyMode()) {
    try {
      return await browserFactoryRequest<T>(path, options);
    } catch (err) {
      throw new ApiClientError(
        err instanceof Error ? err.message : 'Erro no modo navegador.',
        400,
      );
    }
  }

  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = 'Não foi possível concluir a operação.';
    let details: string[] | undefined;

    try {
      const payload = (await res.json()) as {
        message?: string;
        details?: string[];
      };
      if (payload.message) message = payload.message;
      if (Array.isArray(payload.details)) details = payload.details;
    } catch {
      message = `Erro de comunicação (HTTP ${res.status}).`;
    }

    throw new ApiClientError(message, res.status, details);
  }

  return res.json() as Promise<T>;
}

export async function apiDownloadBlob(path: string, fallbackFilename: string): Promise<void> {
  if (isBrowserOnlyMode()) {
    await browserFactoryDownloadZip(path, fallbackFilename);
    return;
  }

  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new ApiClientError('Não foi possível baixar o pacote do projeto.', res.status);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || fallbackFilename;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

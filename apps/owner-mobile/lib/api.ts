import { useAuthStore } from '@/store/auth';
import { storage, StorageKeys } from '@/lib/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ApiSuccess<T> = { ok: true; data: T; status: number };
export type ApiError = { ok: false; error: string; status: number };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await storage.get(StorageKeys.REFRESH_TOKEN);
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${BASE_URL}/api/v1/auth/owner/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { accessToken?: string };
    if (data.accessToken) {
      await storage.set(StorageKeys.ACCESS_TOKEN, data.accessToken);
      const { owner } = useAuthStore.getState();
      if (owner) {
        useAuthStore.getState().setAuth(data.accessToken, owner);
      }
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function ownerApi<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const { body, skipAuth = false, ...rest } = options;
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string> | undefined),
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    ...rest,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  try {
    let response = await fetch(`${BASE_URL}${path}`, fetchOptions);

    if (response.status === 401 && !skipAuth) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${BASE_URL}${path}`, {
          ...fetchOptions,
          headers,
        });
      } else {
        useAuthStore.getState().clearAuth();
        return { ok: false, error: 'Session expired. Please log in again.', status: 401 };
      }
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? ((await response.json()) as T) : ({} as T);

    if (!response.ok) {
      const errData = data as { message?: string };
      return {
        ok: false,
        error: errData?.message ?? `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return { ok: true, data, status: response.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
    return { ok: false, error: message, status: 0 };
  }
}

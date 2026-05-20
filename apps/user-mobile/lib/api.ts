import { useAuthStore } from '@/store/auth';

const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001') + '/api/v1';

type ApiSuccess<T> = { ok: true; data: T };
type ApiError = { ok: false; error: string; status?: number };
type ApiResult<T> = ApiSuccess<T> | ApiError;

interface RefreshResponse {
  accessToken: string;
}

async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/user/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as RefreshResponse;
    return json.accessToken ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<ApiResult<T>> {
  const { accessToken, setAuth, user, clearAuth } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401 && retry) {
      const newToken = await refreshToken();
      if (newToken && user) {
        await setAuth(newToken, user);
        return request<T>(path, options, false);
      } else {
        await clearAuth();
        return { ok: false, error: 'Session expired. Please login again.', status: 401 };
      }
    }

    if (!res.ok) {
      let errorMessage = `Request failed with status ${res.status}`;
      try {
        const errorBody = (await res.json()) as { message?: string; error?: string };
        errorMessage = errorBody.message ?? errorBody.error ?? errorMessage;
      } catch {
        // Keep default message
      }
      return { ok: false, error: errorMessage, status: res.status };
    }

    if (res.status === 204) {
      return { ok: true, data: null as T };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Network error. Please try again.';
    return { ok: false, error: message };
  }
}

export const userApi = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

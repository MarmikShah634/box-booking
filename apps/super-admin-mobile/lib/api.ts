import { getItem, setItem, deleteItem, StorageKeys } from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string; status: number };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await getItem(StorageKeys.REFRESH_TOKEN);
      if (!refreshToken) return null;

      const response = await fetch(`${BASE_URL}/api/v1/auth/super-admin/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await deleteItem(StorageKeys.ACCESS_TOKEN);
        await deleteItem(StorageKeys.REFRESH_TOKEN);
        await deleteItem(StorageKeys.ADMIN_DATA);
        return null;
      }

      const json = (await response.json()) as { accessToken: string };
      await setItem(StorageKeys.ACCESS_TOKEN, json.accessToken);
      return json.accessToken;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function superAdminApi<T>(
  path: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<ApiResult<T>> {
  const { skipAuth = false, ...fetchOptions } = options ?? {};

  async function doFetch(token: string | null): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string> | undefined),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });
  }

  try {
    let token: string | null = null;
    if (!skipAuth) {
      token = await getItem(StorageKeys.ACCESS_TOKEN);
    }

    let response = await doFetch(token);

    if (response.status === 401 && !skipAuth) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        return { ok: false, error: 'Session expired. Please log in again.', status: 401 };
      }
      response = await doFetch(newToken);
    }

    if (response.status === 423) {
      return {
        ok: false,
        error: 'Account locked for 30 minutes due to too many failed attempts.',
        status: 423,
      };
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errJson = (await response.json()) as { message?: string };
        if (errJson.message) errorMessage = errJson.message;
      } catch {
        // ignore parse errors
      }
      return { ok: false, error: errorMessage, status: response.status };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: message, status: 0 };
  }
}

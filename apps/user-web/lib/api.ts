const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/v1';

type ApiSuccess<T> = { ok: true; data: T };
type ApiError = { ok: false; error: { error: string; message: string; statusCode: number }; status: number };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  serverCookies?: string; // raw Cookie header string for SSR
}

async function request<T>(
  path: string,
  options: FetchOptions = {},
  isRetry = false,
): Promise<ApiResult<T>> {
  const { body, serverCookies, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((rest.headers as Record<string, string> | undefined) ?? {}),
  };

  if (serverCookies) {
    headers['Cookie'] = serverCookies;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...rest,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: { error: 'NETWORK_ERROR', message: 'Network error', statusCode: 0 }, status: 0 };
  }

  if (res.status === 401 && !isRetry && typeof window !== 'undefined') {
    try {
      const refreshRes = await fetch(`${BASE}/auth/user/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) return request<T>(path, options, true);
    } catch {
      // refresh failed
    }
    window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`;
    return { ok: false, error: { error: 'UNAUTHENTICATED', message: 'Session expired', statusCode: 401 }, status: 401 };
  }

  if (res.status === 204) return { ok: true, data: undefined as T };

  let json: unknown;
  try { json = await res.json(); } catch { json = null; }

  if (!res.ok) {
    const err = json as { error?: string; message?: string } | null;
    return {
      ok: false,
      error: {
        error: err?.error ?? 'ERROR',
        message: err?.message ?? `Request failed ${res.status}`,
        statusCode: res.status,
      },
      status: res.status,
    };
  }

  return { ok: true, data: json as T };
}

export const api = {
  get: <T>(path: string, opts?: FetchOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: FetchOptions) => request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: FetchOptions) => request<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, opts?: FetchOptions) => request<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T>(path: string, opts?: FetchOptions) => request<T>(path, { ...opts, method: 'DELETE' }),
};

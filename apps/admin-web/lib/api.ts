const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type ApiSuccess<T> = { ok: true; data: T }
type ApiError = { ok: false; error: string; status?: number }
export type ApiResult<T> = ApiSuccess<T> | ApiError

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  stepUpToken?: string
  actionReason?: string
}

async function request<T>(
  path: string,
  options: FetchOptions = {},
  refreshPath: string,
  isRetry = false,
): Promise<ApiResult<T>> {
  const { body, stepUpToken, actionReason, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string> | undefined),
  }

  if (stepUpToken) {
    headers['X-Step-Up-Token'] = stepUpToken
  }

  if (actionReason) {
    headers['X-Action-Reason'] = actionReason
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    return { ok: false, error: 'Network error. Please check your connection.' }
  }

  if (res.status === 401 && !isRetry) {
    try {
      const refreshRes = await fetch(`${BASE_URL}${refreshPath}`, {
        method: 'POST',
        credentials: 'include',
      })
      if (refreshRes.ok) {
        return request<T>(path, options, refreshPath, true)
      }
    } catch {
      // refresh failed
    }
    return { ok: false, error: 'Session expired. Please log in again.', status: 401 }
  }

  let data: unknown
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.text()
  }

  if (!res.ok) {
    const errMsg =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : `Request failed with status ${res.status}`
    return { ok: false, error: errMsg, status: res.status }
  }

  return { ok: true, data: data as T }
}

// ─── Owner API ───────────────────────────────────────────────────────────────

const OWNER_REFRESH = '/api/v1/auth/owner/refresh'

export function ownerApi<T>(path: string, options: FetchOptions = {}): Promise<ApiResult<T>> {
  return request<T>(`/api/v1${path}`, options, OWNER_REFRESH)
}

// ─── Super-Admin API ─────────────────────────────────────────────────────────

const SA_REFRESH = '/api/v1/auth/super-admin/refresh'

export function superAdminApi<T>(path: string, options: FetchOptions = {}): Promise<ApiResult<T>> {
  return request<T>(`/api/v1${path}`, options, SA_REFRESH)
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export async function presignUpload(
  filename: string,
  contentType: string,
  folder: string,
): Promise<ApiResult<{ uploadUrl: string; key: string; publicUrl: string }>> {
  return ownerApi('/storage/presign-upload', {
    method: 'POST',
    body: { filename, contentType, folder },
  })
}

export async function uploadToR2(uploadUrl: string, file: File): Promise<boolean> {
  try {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    return res.ok
  } catch {
    return false
  }
}

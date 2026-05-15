import { cookies } from 'next/headers'
import { api } from './api'

export interface User {
  id: string
  name: string
  phone: string
  email?: string
  createdAt: string
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_user')
  if (!refreshToken) return null

  const result = await api.get<User>('/auth/user/me', { serverCookies: cookieStore.toString() })
  if (!result.ok) return null
  return result.data
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('refresh_user')?.value
}

export async function hasAuthCookie(): Promise<boolean> {
  const cookieStore = await cookies()
  return !!cookieStore.get('refresh_user')
}

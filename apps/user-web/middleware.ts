import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/me', '/book']

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (!isProtected) return NextResponse.next()

  const refreshToken = request.cookies.get('refresh_user')

  if (!refreshToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/me/:path*', '/book/:path*'],
}

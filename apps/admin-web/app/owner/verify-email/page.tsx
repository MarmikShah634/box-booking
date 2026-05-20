'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { ownerApi } from '@/lib/api'

function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Auto-verify if token is in URL
  useEffect(() => {
    if (token) {
      setStatus('verifying')
      ownerApi('/auth/owner/verify-email', { method: 'POST', body: { token } }).then((res) => {
        if (res.ok) {
          setStatus('verified')
          setTimeout(() => router.push('/owner/login'), 2000)
        } else {
          setStatus('error')
          setError(res.error)
        }
      })
    }
  }, [token, router])

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return
    const res = await ownerApi('/auth/owner/verify-email/resend', { method: 'POST', body: { email } })
    if (!res.ok) {
      setError(res.error)
    } else {
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0 }
          return c - 1
        })
      }, 1000)
    }
  }

  if (status === 'verifying') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    )
  }

  if (status === 'verified') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h2 className="text-xl font-semibold text-gray-900">Email Verified!</h2>
          <p className="mt-2 text-gray-500">Redirecting you to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Mail className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
          <p className="mt-2 text-sm text-gray-500">
            We sent a verification link to{' '}
            <span className="font-medium text-gray-700">{email || 'your email address'}</span>.
            Click the link to verify your account.
          </p>

          {status === 'error' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="w-full rounded-md border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
            </button>
            <a href="/owner/login" className="block text-sm text-emerald-600 hover:underline">
              Back to login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50" />}>
      <VerifyEmailInner />
    </Suspense>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { ownerApi } from '@/lib/api'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const res = await ownerApi('/auth/owner/forgot-password', { method: 'POST', body: data })
    if (!res.ok) { setError(res.error); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center rounded-xl border border-gray-200 bg-white p-8 shadow-card">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-500">
            If an account exists for <strong>{getValues('email')}</strong>, we&apos;ve sent a password reset link.
          </p>
          <Link href="/owner/login" className="mt-6 inline-block text-sm text-emerald-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-1 text-sm text-gray-500">We&apos;ll send you a reset link</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-card">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link href="/owner/login" className="text-emerald-600 hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

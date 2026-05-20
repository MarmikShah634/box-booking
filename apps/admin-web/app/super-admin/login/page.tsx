'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react'
import { superAdminApi } from '@/lib/api'
import { useSuperAdminAuthStore } from '@/store/super-admin-auth'
import type { SuperAdmin } from '@/types'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const setAdmin = useSuperAdminAuthStore((s) => s.setAdmin)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const result = await superAdminApi<{ admin: SuperAdmin }>('/auth/super-admin/login', {
      method: 'POST',
      body: data,
    })
    if (!result.ok) {
      if (result.status === 423) {
        setLocked(true)
        router.push('/super-admin/locked')
        return
      }
      setError(result.error)
      return
    }
    setAdmin(result.data.admin)
    router.push('/super-admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Red identity strip */}
        <div className="mb-6 rounded-lg bg-red-600 px-4 py-2 text-center text-xs font-semibold text-white">
          SUPER ADMIN — RESTRICTED ACCESS
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Platform Admin</h1>
          <p className="mt-1 text-xs text-gray-400">BoxCricket Operations Console</p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          {locked && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Account locked. Redirecting…
            </div>
          )}

          {error && !locked && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-300">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                className="h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-300">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 pr-10 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-10 w-full rounded-md bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            5 failed attempts will lock your account for 30 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}

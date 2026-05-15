'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PhoneInput } from '@/components/auth/PhoneInput'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { friendlyError } from '@/lib/errorMessages'
import { toast } from '@/hooks/useToast'
import Link from 'next/link'
import type { Metadata } from 'next'

const schema = z.object({
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/me'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ phone }: FormData) => {
    const result = await api.post<{ message: string }>('/api/v1/auth/user/send-otp', { phone: `+91${phone}` })

    if (!result.ok) {
      toast({ title: 'Failed to send OTP', description: friendlyError(result.error.error), variant: 'destructive' })
      return
    }

    toast({ title: 'OTP sent!', description: `Sent to +91 ${phone}`, variant: 'success' })
    router.push(`/auth/verify?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}`)
  }

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M3 12h3M18 12h3M12 3v3M12 18v3" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Sign in to BoxCricket
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            Enter your mobile number to continue
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <Label htmlFor="phone" className="mb-2 block">Mobile number</Label>
            <PhoneInput
              id="phone"
              {...register('phone')}
              error={errors.phone?.message}
              autoComplete="tel-national"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={isSubmitting}
          >
            Send OTP
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400 leading-relaxed">
          By continuing, you agree to our{' '}
          <Link href="/legal/terms" className="text-emerald-600 hover:underline underline-offset-2">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="text-emerald-600 hover:underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

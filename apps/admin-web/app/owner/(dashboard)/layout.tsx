'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOwnerAuthStore } from '@/store/owner-auth'
import { OwnerShell } from '@/components/owner/shell/MobileMenu'

export default function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const owner = useOwnerAuthStore((s) => s.owner)
  const router = useRouter()

  useEffect(() => {
    if (!owner) {
      router.replace('/owner/login')
    }
  }, [owner, router])

  if (!owner) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    )
  }

  return <OwnerShell>{children}</OwnerShell>
}

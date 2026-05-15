'use client'

import Link from 'next/link'
import { ShieldOff } from 'lucide-react'

export default function SuperAdminLockedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-900">
          <ShieldOff className="h-7 w-7 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Account Locked</h1>
        <p className="mt-2 text-sm text-gray-400">
          Too many failed login attempts. Your account has been temporarily locked for 30 minutes.
        </p>
        <p className="mt-4 text-xs text-gray-500">
          If you believe this is an error, contact the system administrator out-of-band.
        </p>
        <Link
          href="/super-admin/login"
          className="mt-6 inline-block rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}

'use client'

import { Menu, Bell, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { useOwnerAuthStore } from '@/store/owner-auth'
import { ownerApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { FreeModeBadge } from '@/components/owner/subscription/FreeModeBadge'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { owner, logout } = useOwnerAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await ownerApi('/auth/owner/logout', { method: 'POST' })
    logout()
    router.push('/owner/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden items-center gap-2 md:flex">
          {owner?.subscriptionPlan === 'free' && <FreeModeBadge />}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {owner?.subscriptionPlan === 'free' && (
          <div className="flex items-center gap-2 md:hidden">
            <FreeModeBadge />
          </div>
        )}

        <button className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative group">
          <button className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-gray-700 hover:bg-gray-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              {owner?.name?.charAt(0).toUpperCase() ?? 'O'}
            </div>
            <span className="hidden max-w-32 truncate md:block">{owner?.name ?? 'Owner'}</span>
          </button>
          <div className="absolute right-0 top-full z-20 mt-1 hidden w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg group-hover:block">
            <Link
              href="/owner/settings/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

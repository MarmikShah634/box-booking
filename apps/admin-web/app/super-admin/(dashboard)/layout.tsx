'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSuperAdminAuthStore } from '@/store/super-admin-auth'
import { superAdminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  CalendarDays,
  CreditCard,
  RotateCcw,
  Settings,
  ClipboardList,
  LogOut,
  ShieldAlert,
  X,
  Menu,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/super-admin/owners', label: 'Owners', icon: UserCheck },
  { href: '/super-admin/venues', label: 'Venues', icon: Building2 },
  { href: '/super-admin/users', label: 'Users', icon: Users },
  { href: '/super-admin/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/super-admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/super-admin/refunds', label: 'Refunds', icon: RotateCcw },
  { href: '/super-admin/settings', label: 'Settings', icon: Settings },
  { href: '/super-admin/audit', label: 'Audit Log', icon: ClipboardList },
]

function SuperAdminSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, logout } = useSuperAdminAuthStore()

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  const handleLogout = async () => {
    await superAdminApi('/auth/super-admin/logout', { method: 'POST' })
    logout()
    router.push('/super-admin/login')
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-red-800 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
          <ShieldAlert className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="block text-xs font-bold text-white">SUPER ADMIN</span>
          <span className="block text-[10px] text-red-300">BoxCricket Console</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive(item)
                ? 'bg-red-700/60 text-white'
                : 'text-red-200 hover:bg-white/10 hover:text-white',
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-red-800 p-3">
        {admin && (
          <div className="mb-2 px-2 text-xs text-red-300 truncate">{admin.email}</div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-200 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex md:w-52 md:flex-col bg-gray-900 border-r border-red-900/50">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-56 bg-gray-900">
            <div className="absolute right-3 top-3">
              <button
                onClick={onMobileClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {SidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}

export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = useSuperAdminAuthStore((s) => s.admin)
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!admin) {
      router.replace('/super-admin/login')
    }
  }, [admin, router])

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <SuperAdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Red identity strip */}
        <div className="flex-shrink-0 bg-red-600 px-4 py-1.5 text-center text-xs font-semibold text-white">
          Logged in as SUPER ADMIN — every action is audit-logged
        </div>
        {/* Topbar */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-gray-200">[ADMIN] BoxCricket Console</span>
        </div>
        <main className="flex-1 overflow-y-auto bg-gray-950 text-gray-100">{children}</main>
      </div>
    </div>
  )
}

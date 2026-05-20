'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Star,
  CreditCard,
  Settings,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/owner', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/owner/venues', label: 'Venues', icon: Building2 },
  { href: '/owner/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/owner/reviews', label: 'Reviews', icon: Star },
  { href: '/owner/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/owner/audit', label: 'Audit Log', icon: ClipboardList },
  { href: '/owner/settings/profile', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn('flex items-center border-b border-emerald-700 px-4 py-4', collapsed && 'justify-center')}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <span className="text-sm font-bold text-white">BC</span>
            </div>
            <span className="text-sm font-semibold text-white">BoxCricket</span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <span className="text-sm font-bold text-white">BC</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(item)
                ? 'bg-white/15 text-white'
                : 'text-emerald-100 hover:bg-white/10 hover:text-white',
              collapsed && 'justify-center px-2',
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="border-t border-emerald-700 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-emerald-200 hover:bg-white/10 md:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col bg-emerald-800 transition-all duration-200',
          collapsed ? 'md:w-16' : 'md:w-56',
        )}
      >
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-emerald-800">
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

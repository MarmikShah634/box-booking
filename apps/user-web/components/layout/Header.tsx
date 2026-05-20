'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { MapPin, User, LogOut, ChevronDown } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useCurrentUser()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch(`${BASE_URL}/api/v1/auth/user/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M3 12h3M18 12h3M12 3v3M12 18v3" strokeLinecap="round" />
              <path d="M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M16.243 7.757l2.121-2.121M5.636 18.364l2.121-2.121" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">BoxCricket</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {[
            { label: 'Find Venues', href: '/city/bangalore' },
            { label: 'How it works', href: '/#how-it-works' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                isActive(href)
                  ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="w-24 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 max-w-[120px] truncate">
                  {user.name || user.phone}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-zinc-400 transition-transform', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-zinc-200 bg-white shadow-card-hover dark:border-zinc-700 dark:bg-zinc-900 animate-slide-up">
                  <div className="p-1">
                    <Link
                      href="/me"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      My Bookings
                    </Link>
                    <Link
                      href="/me/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </div>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 p-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button asChild size="sm" variant="default">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

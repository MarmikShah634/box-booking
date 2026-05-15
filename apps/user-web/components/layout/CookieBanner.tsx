'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const COOKIE_KEY = 'cookie-consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY)
    if (!accepted) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-16 md:bottom-4 left-0 right-0 z-50 px-4 md:left-auto md:right-4 md:max-w-sm"
    >
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sheet dark:border-zinc-700 dark:bg-zinc-900 animate-slide-up">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
          We use cookies to improve your experience. By continuing, you agree to our{' '}
          <Link href="/legal/privacy" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={accept} className="flex-1">
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={() => setVisible(false)} className="flex-1">
            Decline
          </Button>
        </div>
      </div>
    </div>
  )
}

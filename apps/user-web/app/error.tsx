'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60dvh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">Something went wrong</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
          An unexpected error occurred. Please try refreshing the page.
          {error.digest && (
            <span className="block mt-2 font-mono text-xs text-zinc-400">Ref: {error.digest}</span>
          )}
        </p>
        <Button onClick={reset}>
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
      </div>
    </div>
  )
}

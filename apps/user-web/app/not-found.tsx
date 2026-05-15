import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60dvh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-zinc-300 dark:text-zinc-600">404</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">Page not found</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/city/bangalore">
              <Search className="w-4 h-4" />
              Browse venues
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

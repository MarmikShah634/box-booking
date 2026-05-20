import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title?: string
  description?: string
  onReset?: () => void
}

export function EmptyState({
  title = 'No venues found',
  description = 'Try adjusting your filters or searching in a different city.',
  onReset,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">{description}</p>
      {onReset && (
        <Button onClick={onReset} variant="outline" className="mt-6">
          Clear filters
        </Button>
      )}
    </div>
  )
}

import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'
import { paiseToRupees } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface Box {
  id: string
  name: string
  description?: string
  capacity: number
  minPricePaise: number
  isActive: boolean
  surface?: string
  dimensions?: string
}

interface BoxListProps {
  boxes: Box[]
}

export function BoxList({ boxes }: BoxListProps) {
  if (boxes.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
        No boxes available at this venue.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {boxes.map((box) => (
        <div
          key={box.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{box.name}</h3>
              {!box.isActive && <Badge variant="secondary">Unavailable</Badge>}
            </div>
            <div className="flex flex-wrap gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                <Users className="w-3.5 h-3.5" />
                Up to {box.capacity} players
              </span>
              {box.surface && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{box.surface}</span>
              )}
              {box.dimensions && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{box.dimensions}</span>
              )}
            </div>
            {box.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{box.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-xs text-zinc-400">From</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {paiseToRupees(box.minPricePaise)}<span className="text-xs font-normal text-zinc-400">/hr</span>
              </p>
            </div>
            {box.isActive ? (
              <Button asChild size="sm" variant="cta">
                <Link href={`/book/${box.id}`}>
                  Book
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                Unavailable
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

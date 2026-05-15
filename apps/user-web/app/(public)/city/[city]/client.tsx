'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { VenueCard, type VenueListItem } from '@/components/listing/VenueCard'
import { Filters } from '@/components/listing/Filters'
import { EmptyState } from '@/components/listing/EmptyState'
import { Button } from '@/components/ui/button'
import { useFilterStore } from '@/store/filterStore'
import { cn } from '@/lib/utils'

interface CityListingClientProps {
  city: string
  cityDisplay: string
  initialVenues: VenueListItem[]
  total: number
}

export function CityListingClient({ cityDisplay, initialVenues, total }: CityListingClientProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { reset } = useFilterStore()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Cricket venues in {cityDisplay}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {total} venue{total !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Mobile filter toggle */}
      <div className="flex items-center gap-2 mb-4 md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters — desktop always visible, mobile drawer */}
        <aside
          className={cn(
            'shrink-0 w-full md:w-64 md:block',
            filtersOpen ? 'block' : 'hidden',
          )}
        >
          {/* Mobile close */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">Filters</h2>
            <button
              onClick={() => setFiltersOpen(false)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <Filters />
        </aside>

        {/* Venue listing */}
        <div className={cn('flex-1 min-w-0', filtersOpen && 'md:block hidden')}>
          {initialVenues.length === 0 ? (
            <EmptyState onReset={reset} />
          ) : (
            <>
              <div className="space-y-4">
                {initialVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>

              {/* Load more */}
              {initialVenues.length < total && (
                <div className="mt-8 text-center">
                  <Button variant="outline">
                    Load more venues
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

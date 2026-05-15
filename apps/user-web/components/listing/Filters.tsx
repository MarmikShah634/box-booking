'use client'

import { useFilterStore, type TimeOfDay, type SortOption } from '@/store/filterStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TIME_CHIPS: { label: string; value: TimeOfDay; hours: string }[] = [
  { label: 'Morning', value: 'morning', hours: '6–12 AM' },
  { label: 'Afternoon', value: 'afternoon', hours: '12–4 PM' },
  { label: 'Evening', value: 'evening', hours: '4–8 PM' },
  { label: 'Night', value: 'night', hours: '8 PM+' },
]

const AMENITIES = ['Floodlights', 'Parking', 'Washroom', 'Cafeteria', 'Equipment', 'AC Lounge', 'Shower']

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Highest Rated', value: 'rating_desc' },
]

export function Filters() {
  const {
    minPrice, maxPrice, timeOfDay, amenities, sort,
    setMinPrice, setMaxPrice, toggleTimeOfDay, toggleAmenity, setSort, reset,
  } = useFilterStore()

  const hasActiveFilters =
    minPrice > 0 || maxPrice < 10000 || timeOfDay.length > 0 || amenities.length > 0 || sort !== 'recommended'

  return (
    <aside className="space-y-6">
      {/* Sort */}
      <div>
        <Label className="mb-2 block text-zinc-700 dark:text-zinc-300 font-semibold">Sort by</Label>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price range */}
      <div>
        <Label className="mb-3 block text-zinc-700 dark:text-zinc-300 font-semibold">Price per hour</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-xs text-zinc-400 mb-1 block">Min (₹)</Label>
            <input
              type="number"
              min={0}
              max={maxPrice}
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
              aria-label="Minimum price"
            />
          </div>
          <span className="text-zinc-300 dark:text-zinc-600 mt-5">—</span>
          <div className="flex-1">
            <Label className="text-xs text-zinc-400 mb-1 block">Max (₹)</Label>
            <input
              type="number"
              min={minPrice}
              max={20000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>

      {/* Time of day */}
      <div>
        <Label className="mb-3 block text-zinc-700 dark:text-zinc-300 font-semibold">Time of day</Label>
        <div className="grid grid-cols-2 gap-2">
          {TIME_CHIPS.map((chip) => {
            const active = timeOfDay.includes(chip.value)
            return (
              <button
                key={chip.value}
                onClick={() => toggleTimeOfDay(chip.value)}
                className={cn(
                  'flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                  'min-h-[44px]',
                  active
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-600'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
                )}
                aria-pressed={active}
              >
                <span className={cn('text-sm font-medium', active ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300')}>
                  {chip.label}
                </span>
                <span className="text-xs text-zinc-400 mt-0.5">{chip.hours}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <Label className="mb-3 block text-zinc-700 dark:text-zinc-300 font-semibold">Amenities</Label>
        <div className="space-y-2.5">
          {AMENITIES.map((amenity) => (
            <div key={amenity} className="flex items-center gap-2.5">
              <Checkbox
                id={`amenity-${amenity}`}
                checked={amenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <Label
                htmlFor={`amenity-${amenity}`}
                className="text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer"
              >
                {amenity}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={reset} className="w-full">
          Clear all filters
        </Button>
      )}
    </aside>
  )
}

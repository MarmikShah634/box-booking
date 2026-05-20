import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Clock, Wifi, Droplets, ParkingMeter } from 'lucide-react'
import { paiseToRupees } from '@/lib/currency'
import { Badge } from '@/components/ui/badge'

export interface VenueListItem {
  id: string
  slug: string
  name: string
  city: string
  area: string
  address: string
  coverImage?: string
  rating?: number
  reviewCount?: number
  minPricePaise: number
  amenities?: string[]
  openTime?: string
  closeTime?: string
  availableBoxCount?: number
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3.5 h-3.5" />,
  parking: <ParkingMeter className="w-3.5 h-3.5" />,
  showers: <Droplets className="w-3.5 h-3.5" />,
}

export function VenueCard({ venue }: { venue: VenueListItem }) {
  return (
    <Link
      href={`/venue/${venue.slug}`}
      className="group flex flex-col sm:flex-row gap-0 rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:shadow-card-hover transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {/* Image */}
      <div className="relative h-48 sm:h-auto sm:w-56 shrink-0 overflow-hidden">
        <Image
          src={venue.coverImage || `https://picsum.photos/seed/${venue.slug}/600/400`}
          alt={`${venue.name} cricket venue`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 224px"
        />
        {(venue.availableBoxCount !== undefined) && (
          <div className="absolute bottom-2 left-2">
            <Badge variant={venue.availableBoxCount > 0 ? 'success' : 'destructive'}>
              {venue.availableBoxCount > 0 ? `${venue.availableBoxCount} box${venue.availableBoxCount > 1 ? 'es' : ''} open` : 'Fully booked'}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col p-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
              {venue.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5 text-zinc-500 dark:text-zinc-400">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="text-sm truncate">{venue.area}, {venue.city}</span>
            </div>
          </div>

          {venue.rating && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{venue.rating.toFixed(1)}</span>
              {venue.reviewCount && (
                <span className="text-xs text-zinc-400">({venue.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Amenity chips */}
        {venue.amenities && venue.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {venue.amenities.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 rounded-full px-2 py-0.5"
              >
                {AMENITY_ICONS[amenity.toLowerCase()]}
                {amenity}
              </span>
            ))}
          </div>
        )}

        {/* Hours */}
        {venue.openTime && venue.closeTime && (
          <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{venue.openTime} – {venue.closeTime}</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-700 mt-3">
          <div>
            <span className="text-xs text-zinc-400">From </span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {paiseToRupees(venue.minPricePaise)}
            </span>
            <span className="text-xs text-zinc-400"> /hr</span>
          </div>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            View details →
          </span>
        </div>
      </div>
    </Link>
  )
}

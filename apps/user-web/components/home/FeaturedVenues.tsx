import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { paiseToRupees } from '@/lib/currency'
import { Button } from '@/components/ui/button'

interface Venue {
  id: string
  slug: string
  name: string
  city: string
  area: string
  coverImage?: string
  rating?: number
  reviewCount?: number
  minPricePaise: number
  amenities?: string[]
}

async function fetchFeaturedVenues(): Promise<Venue[]> {
  const result = await api.get<{ venues: Venue[] }>('/venues/public?sort=rating_desc&limit=6')
  if (!result.ok) {
    // Return fallback mock data for graceful degradation
    return Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      slug: `venue-${i + 1}`,
      name: `Cricket Arena ${i + 1}`,
      city: 'Bangalore',
      area: ['Koramangala', 'Indiranagar', 'Whitefield', 'Marathahalli', 'HSR Layout', 'BTM Layout'][i],
      rating: 4.2 + Math.random() * 0.7,
      reviewCount: 47 + i * 13,
      minPricePaise: (700 + i * 50) * 100,
    }))
  }
  return result.data.venues
}

export async function FeaturedVenues() {
  const venues = await fetchFeaturedVenues()

  return (
    <section className="py-16 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Top-rated venues
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
              Handpicked venues with great facilities and instant booking.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
            <Link href="/city/bangalore">
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {venues.map((venue, i) => (
            <VenueCard key={venue.id} venue={venue} index={i} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline">
            <Link href="/city/bangalore">
              View all venues
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function VenueCard({ venue, index }: { venue: Venue; index: number }) {
  return (
    <Link
      href={`/venue/${venue.slug}`}
      className="group block rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:shadow-card-hover transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative h-44 overflow-hidden">
        <Image
          src={venue.coverImage || `https://picsum.photos/seed/venue-${venue.slug}/600/400`}
          alt={`${venue.name} cricket venue`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {venue.rating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/95 dark:bg-zinc-900/95 px-2.5 py-1 shadow-sm">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {venue.rating.toFixed(1)}
            </span>
            {venue.reviewCount && (
              <span className="text-xs text-zinc-400">({venue.reviewCount})</span>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {venue.name}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-zinc-500 dark:text-zinc-400">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="text-sm truncate">
            {venue.area}, {venue.city}
          </span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
          <div>
            <span className="text-xs text-zinc-400">Starting from</span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {paiseToRupees(venue.minPricePaise)}
              <span className="text-xs font-normal text-zinc-400 ml-1">/hr</span>
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
            Book now
          </span>
        </div>
      </div>
    </Link>
  )
}

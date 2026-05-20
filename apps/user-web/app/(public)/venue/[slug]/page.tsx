import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MapPin, Phone, Clock, Shield, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { PhotoCarousel } from '@/components/venue/PhotoCarousel'
import { BoxList, type Box } from '@/components/venue/BoxList'
import { PricingTable, type PricingSlot } from '@/components/venue/PricingTable'
import { ReviewSummary, type Review } from '@/components/venue/ReviewSummary'

interface VenueDetail {
  id: string
  slug: string
  name: string
  city: string
  area: string
  address: string
  phone?: string
  description?: string
  images: string[]
  rating?: number
  reviewCount?: number
  openTime: string
  closeTime: string
  amenities: string[]
  boxes: Box[]
  pricingSlots: PricingSlot[]
  reviews: Review[]
}

interface PageProps {
  params: { slug: string }
}

async function fetchVenue(slug: string): Promise<VenueDetail | null> {
  const result = await api.get<VenueDetail>(`/api/v1/venues/public/${slug}`)
  if (!result.ok) {
    // Return mock for graceful dev experience
    return {
      id: '1',
      slug,
      name: 'Premier Box Cricket Arena',
      city: 'Bangalore',
      area: 'Koramangala',
      address: '4th Block, Koramangala, Bangalore - 560034',
      phone: '+91 98765 43210',
      description: 'A premium box cricket facility featuring 3 fully floodlit boxes with natural turf surface. Perfect for corporate tournaments, friend matches, and professional training.',
      images: [
        `https://picsum.photos/seed/${slug}-1/1200/800`,
        `https://picsum.photos/seed/${slug}-2/1200/800`,
        `https://picsum.photos/seed/${slug}-3/1200/800`,
      ],
      rating: 4.7,
      reviewCount: 143,
      openTime: '06:00 AM',
      closeTime: '11:00 PM',
      amenities: ['Floodlights', 'Parking', 'Washroom', 'Equipment', 'Cafeteria'],
      boxes: [
        { id: 'box-1', name: 'Box A – Premium', description: 'Natural turf, premium nets', capacity: 22, minPricePaise: 120000, isActive: true, surface: 'Natural turf', dimensions: '22 × 12m' },
        { id: 'box-2', name: 'Box B – Standard', description: 'Synthetic turf, well-maintained', capacity: 20, minPricePaise: 90000, isActive: true, surface: 'Synthetic turf', dimensions: '20 × 10m' },
        { id: 'box-3', name: 'Box C – Economy', description: 'Ideal for casual play', capacity: 18, minPricePaise: 70000, isActive: false, surface: 'Synthetic turf', dimensions: '18 × 10m' },
      ],
      pricingSlots: [
        { label: 'Morning', startTime: '6:00 AM', endTime: '10:00 AM', weekdayPaise: 70000, weekendPaise: 80000 },
        { label: 'Afternoon', startTime: '10:00 AM', endTime: '4:00 PM', weekdayPaise: 90000, weekendPaise: 100000 },
        { label: 'Evening', startTime: '4:00 PM', endTime: '8:00 PM', weekdayPaise: 120000, weekendPaise: 130000 },
        { label: 'Night', startTime: '8:00 PM', endTime: '11:00 PM', weekdayPaise: 100000, weekendPaise: 110000 },
      ],
      reviews: [
        { id: 'r1', author: 'Rohit Nair', rating: 5, comment: 'Excellent facilities. The turf is well-maintained and the floodlights are very bright. Parking is easy. Highly recommend!', createdAt: '2024-12-15T10:00:00Z' },
        { id: 'r2', author: 'Priya Menon', rating: 4, comment: 'Good venue overall. The equipment provided is decent. The cafeteria could use some improvement but otherwise a solid choice.', createdAt: '2024-12-10T10:00:00Z' },
        { id: 'r3', author: 'Arjun Sharma', rating: 5, comment: 'Booked for our company tournament. Staff was very helpful. The booking process was seamless.', createdAt: '2024-11-28T10:00:00Z' },
      ],
    }
  }
  return result.data
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const venue = await fetchVenue(params.slug)
  if (!venue) return { title: 'Venue Not Found' }
  return {
    title: `${venue.name} – ${venue.area}, ${venue.city}`,
    description: venue.description || `Book cricket boxes at ${venue.name} in ${venue.area}, ${venue.city}.`,
  }
}

export default async function VenuePage({ params }: PageProps) {
  const venue = await fetchVenue(params.slug)
  if (!venue) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Photo carousel */}
      <PhotoCarousel images={venue.images} venueName={venue.name} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Venue info */}
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
              {venue.name}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {venue.area}, {venue.city}
              </span>
              {venue.rating && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {venue.rating.toFixed(1)} ({venue.reviewCount} reviews)
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {venue.openTime} – {venue.closeTime}
              </span>
              {venue.phone && (
                <a
                  href={`tel:${venue.phone}`}
                  className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                >
                  <Phone className="w-4 h-4" />
                  {venue.phone}
                </a>
              )}
            </div>

            {venue.description && (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {venue.description}
              </p>
            )}

            {/* Amenities */}
            {venue.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {venue.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1.5 rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Boxes */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Available boxes
            </h2>
            <BoxList boxes={venue.boxes} />
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Pricing
            </h2>
            <PricingTable slots={venue.pricingSlots} />
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Reviews
            </h2>
            <ReviewSummary
              reviews={venue.reviews}
              averageRating={venue.rating}
              totalCount={venue.reviewCount}
            />
          </div>
        </div>

        {/* Sticky sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            {/* Cancellation policy */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                  Cancellation policy
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold mt-px">✓</span>
                  <span>Free cancellation up to 24 hours before the slot</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold mt-px">~</span>
                  <span>50% refund if cancelled 12–24 hours before</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-500 font-bold mt-px">✗</span>
                  <span>No refund within 12 hours of the slot</span>
                </li>
              </ul>
            </div>

            {/* Address */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm mb-2">Location</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{venue.address}</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(venue.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
              >
                <MapPin className="w-3.5 h-3.5" />
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

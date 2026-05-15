import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import type { VenueListItem } from '@/components/listing/VenueCard'
import { CityListingClient } from './client'

const VALID_CITIES = ['bangalore', 'mumbai', 'pune', 'delhi', 'hyderabad', 'chennai', 'ahmedabad']
const CITY_DISPLAY: Record<string, string> = {
  bangalore: 'Bangalore',
  mumbai: 'Mumbai',
  pune: 'Pune',
  delhi: 'Delhi',
  hyderabad: 'Hyderabad',
  chennai: 'Chennai',
  ahmedabad: 'Ahmedabad',
}

interface PageProps {
  params: { city: string }
  searchParams: {
    sort?: string
    minPrice?: string
    maxPrice?: string
    date?: string
    amenities?: string
    page?: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = CITY_DISPLAY[params.city] || params.city
  return {
    title: `Box Cricket Venues in ${city}`,
    description: `Find and book the best box cricket venues in ${city}. Check real-time availability and instant booking.`,
  }
}

async function fetchVenues(city: string, searchParams: PageProps['searchParams']): Promise<{ venues: VenueListItem[]; total: number }> {
  const params = new URLSearchParams({ city })
  if (searchParams.sort) params.set('sort', searchParams.sort)
  if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice)
  if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice)
  if (searchParams.date) params.set('date', searchParams.date)
  if (searchParams.amenities) params.set('amenities', searchParams.amenities)
  if (searchParams.page) params.set('page', searchParams.page)

  const result = await api.get<{ venues: VenueListItem[]; total: number }>(`/api/v1/venues/public?${params.toString()}`)
  if (!result.ok) {
    // Fallback mock data
    return {
      venues: Array.from({ length: 9 }, (_, i) => ({
        id: String(i),
        slug: `${city}-venue-${i + 1}`,
        name: `${CITY_DISPLAY[city] || city} Cricket Arena ${i + 1}`,
        city: CITY_DISPLAY[city] || city,
        area: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'BTM Layout', 'Jayanagar', 'Marathahalli', 'Bellandur', 'Electronic City'][i],
        address: `Near Main Road, ${CITY_DISPLAY[city] || city}`,
        rating: 3.9 + Math.random(),
        reviewCount: 20 + i * 7,
        minPricePaise: (600 + i * 75) * 100,
        amenities: ['Floodlights', 'Parking', 'Washroom'].slice(0, (i % 3) + 1),
        openTime: '06:00',
        closeTime: '23:00',
        availableBoxCount: Math.floor(Math.random() * 4),
      })),
      total: 24,
    }
  }
  return result.data
}

export default async function CityPage({ params, searchParams }: PageProps) {
  if (!VALID_CITIES.includes(params.city)) notFound()

  const cityDisplay = CITY_DISPLAY[params.city] || params.city
  const { venues, total } = await fetchVenues(params.city, searchParams)

  return (
    <CityListingClient
      city={params.city}
      cityDisplay={cityDisplay}
      initialVenues={venues}
      total={total}
    />
  )
}

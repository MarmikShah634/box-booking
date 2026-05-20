import Link from 'next/link'
import Image from 'next/image'

const CITIES = [
  { name: 'Bangalore', slug: 'bangalore', venueCount: 47, image: 'seed/bengaluru-cricket/400/300' },
  { name: 'Mumbai', slug: 'mumbai', venueCount: 38, image: 'seed/mumbai-cricket/400/300' },
  { name: 'Pune', slug: 'pune', venueCount: 29, image: 'seed/pune-cricket/400/300' },
  { name: 'Delhi', slug: 'delhi', venueCount: 33, image: 'seed/delhi-cricket/400/300' },
  { name: 'Hyderabad', slug: 'hyderabad', venueCount: 24, image: 'seed/hyderabad-cricket/400/300' },
  { name: 'Chennai', slug: 'chennai', venueCount: 21, image: 'seed/chennai-cricket/400/300' },
  { name: 'Ahmedabad', slug: 'ahmedabad', venueCount: 18, image: 'seed/ahmedabad-cricket/400/300' },
]

export function CityPicker() {
  return (
    <section className="py-16 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Browse by city
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
            Tap your city to see all available venues and book instantly.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {CITIES.map((city, index) => (
            <Link
              key={city.slug}
              href={`/city/${city.slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-square block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Image
                src={`https://picsum.photos/${city.image}`}
                alt={city.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 14vw"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-sm font-semibold text-white">{city.name}</p>
                <p className="text-xs text-zinc-300">{city.venueCount} venues</p>
              </div>

              {/* Hover ring */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-emerald-500/60 transition-all duration-200" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

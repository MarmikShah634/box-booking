import Image from 'next/image';

const cities = [
  { name: 'Bangalore', slug: 'bangalore', venues: 87, seed: 'bangalore-city' },
  { name: 'Mumbai', slug: 'mumbai', venues: 64, seed: 'mumbai-city' },
  { name: 'Pune', slug: 'pune', venues: 43, seed: 'pune-city' },
  { name: 'Delhi', slug: 'delhi', venues: 52, seed: 'delhi-city' },
  { name: 'Hyderabad', slug: 'hyderabad', venues: 38, seed: 'hyderabad-city' },
  { name: 'Chennai', slug: 'chennai', venues: 29, seed: 'chennai-city' },
  { name: 'Ahmedabad', slug: 'ahmedabad', venues: 21, seed: 'ahmedabad-city' },
];

export function CityGrid() {
  return (
    <section id="cities" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="mb-12">
        <p className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-3">Locations</p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-[var(--text-primary)]">
          Your city, your pitch.
        </h2>
      </div>

      {/* Asymmetric masonry-style grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cities.map((city, i) => (
          <a
            key={city.slug}
            href={`http://localhost:3000/city/${city.slug}`}
            className={`relative rounded-2xl overflow-hidden group cursor-pointer ${
              i === 0 ? 'md:col-span-2 md:row-span-2' : ''
            } ${i === 3 ? 'md:col-span-2' : ''}`}
          >
            <div className={`relative ${i === 0 ? 'h-64 md:h-full min-h-[320px]' : 'h-36 md:h-44'}`}>
              <Image
                src={`https://picsum.photos/seed/${city.seed}/600/400`}
                alt={city.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="text-white font-semibold text-lg tracking-tight">{city.name}</div>
                <div className="text-zinc-400 text-xs mt-0.5">
                  {city.venues} venues
                </div>
              </div>

              {/* Hover arrow */}
              <div className="absolute top-3 right-3 w-8 h-8 bg-white/0 group-hover:bg-white/10 rounded-full flex items-center justify-center transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4 opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

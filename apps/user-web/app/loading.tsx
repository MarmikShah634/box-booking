import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <Skeleton className="h-[400px] rounded-2xl w-full" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

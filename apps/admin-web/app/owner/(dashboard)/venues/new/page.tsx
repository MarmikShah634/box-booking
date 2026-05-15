'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { VenueForm, type VenueFormData } from '@/components/owner/venues/VenueForm'
import { ownerApi } from '@/lib/api'
import type { Venue } from '@/types'

export default function NewVenuePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: VenueFormData) => {
    setError(null)
    const res = await ownerApi<Venue>('/venues', { method: 'POST', body: data })
    if (!res.ok) { setError(res.error); return }
    router.push(`/owner/venues/${res.data.id}`)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/owner/venues" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add New Venue</h1>
          <p className="text-sm text-gray-500">Fill in the details about your venue</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <VenueForm onSubmit={handleSubmit} error={error} submitLabel="Create Venue" />
      </div>
    </div>
  )
}

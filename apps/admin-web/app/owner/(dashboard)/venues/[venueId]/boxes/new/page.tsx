'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import { BoxForm, type BoxFormData } from '@/components/owner/boxes/BoxForm'
import type { Box as BoxType } from '@/types'

export default function NewBoxPage() {
  const { venueId } = useParams<{ venueId: string }>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: BoxFormData) => {
    setError(null)
    const res = await ownerApi<BoxType>(`/venues/${venueId}/boxes`, { method: 'POST', body: data })
    if (!res.ok) { setError(res.error); return }
    router.push(`/owner/venues/${venueId}/boxes/${res.data.id}/pricing`)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/owner/venues/${venueId}/boxes`} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add New Box</h1>
          <p className="text-sm text-gray-500">Configure a new pitch or box</p>
        </div>
      </div>
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <BoxForm onSubmit={handleSubmit} error={error} submitLabel="Create Box & Set Pricing" />
      </div>
    </div>
  )
}

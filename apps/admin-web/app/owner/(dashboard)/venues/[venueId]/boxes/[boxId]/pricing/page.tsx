'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import type { Box as BoxType } from '@/types'
import { PricingTableEditor } from '@/components/owner/boxes/PricingTableEditor'

interface PricingBand {
  id: string
  label: string
  startHour: number
  endHour: number
  weekdayPricePaise: number
  weekendPricePaise: number
}

export default function PricingPage() {
  const { venueId, boxId } = useParams<{ venueId: string; boxId: string }>()
  const [box, setBox] = useState<BoxType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ownerApi<BoxType>(`/boxes/${boxId}`).then((res) => {
      if (res.ok) setBox(res.data)
      setLoading(false)
    })
  }, [boxId])

  const toPricingBand = (r: BoxType['pricingRules'][number]): PricingBand => ({
    id: r.id,
    label: r.label ?? `${r.startHour}:00–${r.endHour}:00`,
    startHour: r.startHour,
    endHour: r.endHour,
    weekdayPricePaise: r.weekdayPricePaise,
    weekendPricePaise: r.weekendPricePaise,
  })

  const handleSavePricing = async (bands: PricingBand[]) => {
    await ownerApi(`/boxes/${boxId}/pricing-rules`, { method: 'PUT', body: { rules: bands } })
  }

  if (loading) {
    return <div className="flex min-h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" /></div>
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/owner/venues/${venueId}/boxes/${boxId}`} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pricing Rules</h1>
          <p className="text-sm text-gray-500">{box?.name}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <p className="mb-6 text-sm text-gray-500">
          Define pricing bands by time slot. All hours must be covered without gaps or overlaps.
          Prices are per hour in ₹.
        </p>
        {box && (
          <PricingTableEditor
            initialBands={box.pricingRules.map(toPricingBand)}
            onSave={handleSavePricing}
          />
        )}
      </div>
    </div>
  )
}

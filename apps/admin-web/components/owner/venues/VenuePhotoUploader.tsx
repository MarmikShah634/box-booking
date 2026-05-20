'use client'

import { useState } from 'react'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { ownerApi } from '@/lib/api'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface VenuePhotoUploaderProps {
  venueId: string
  initialPhotos?: string[]
}

export function VenuePhotoUploader({ venueId, initialPhotos = [] }: VenuePhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setResult(null)
    const res = await ownerApi(`/venues/${venueId}/photos`, {
      method: 'POST',
      body: { photos },
    })
    setResult({ ok: res.ok, msg: res.ok ? 'Photos saved!' : (res as { error: string }).error })
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <ImageUploader
        value={photos}
        onChange={setPhotos}
        folder={`venues/${venueId}`}
        maxFiles={12}
        maxSizeMB={8}
      />
      {result && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {result.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {result.msg}
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || photos.length === 0}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Photos'}
        </button>
      </div>
    </div>
  )
}

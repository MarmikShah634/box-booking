'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle } from 'lucide-react'

const AMENITIES_OPTIONS = [
  'Parking', 'Changing Rooms', 'Washrooms', 'Cafeteria', 'First Aid',
  'CCTV', 'Floodlights', 'Seating Area', 'Wi-Fi',
]

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  address: z.string().min(5, 'Enter full address'),
  city: z.string().min(2, 'Enter city'),
  state: z.string().min(2, 'Enter state'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  amenities: z.array(z.string()),
})

export type VenueFormData = z.infer<typeof schema>

interface VenueFormProps {
  defaultValues?: Partial<VenueFormData>
  onSubmit: (data: VenueFormData) => Promise<void>
  submitLabel?: string
  error?: string | null
}

export function VenueForm({ defaultValues, onSubmit, submitLabel = 'Save Venue', error }: VenueFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VenueFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amenities: [],
      ...defaultValues,
    },
  })

  const selectedAmenities = watch('amenities')

  const toggleAmenity = (amenity: string) => {
    const current = selectedAmenities ?? []
    if (current.includes(amenity)) {
      setValue('amenities', current.filter((a) => a !== amenity))
    } else {
      setValue('amenities', [...current, amenity])
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Venue Name</label>
          <input
            {...register('name')}
            placeholder="e.g., Champions Box Cricket"
            className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Tell players about your venue..."
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Address</label>
          <input
            {...register('address')}
            placeholder="Street address, landmark"
            className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">City</label>
          <input
            {...register('city')}
            placeholder="Mumbai"
            className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">State</label>
          <input
            {...register('state')}
            placeholder="Maharashtra"
            className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Pincode</label>
          <input
            {...register('pincode')}
            placeholder="400001"
            maxLength={6}
            className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode.message}</p>}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES_OPTIONS.map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedAmenities?.includes(amenity)
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {amenity}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

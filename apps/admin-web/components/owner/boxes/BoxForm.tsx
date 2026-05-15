'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle } from 'lucide-react'

const SPORT_TYPES = ['Box Cricket', 'Turf Football', 'Badminton', 'Pickleball', 'Padel']
const BOX_AMENITIES = ['Bat & Ball', 'Gloves', 'Helmet', 'Scoring Board', 'Floodlights', 'Water Cooler']

const schema = z.object({
  name: z.string().min(2, 'Box name required'),
  description: z.string().optional(),
  capacity: z.coerce.number().min(2, 'Min 2 players').max(30, 'Max 30 players'),
  sportType: z.string().min(1, 'Select sport type'),
  amenities: z.array(z.string()),
  isActive: z.boolean(),
})

export type BoxFormData = z.infer<typeof schema>

interface BoxFormProps {
  defaultValues?: Partial<BoxFormData>
  onSubmit: (data: BoxFormData) => Promise<void>
  submitLabel?: string
  error?: string | null
}

export function BoxForm({ defaultValues, onSubmit, submitLabel = 'Save Box', error }: BoxFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BoxFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amenities: [],
      isActive: true,
      sportType: 'Box Cricket',
      ...defaultValues,
    },
  })

  const selectedAmenities = watch('amenities')

  const toggleAmenity = (a: string) => {
    const current = selectedAmenities ?? []
    setValue('amenities', current.includes(a) ? current.filter((x) => x !== a) : [...current, a])
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Box Name</label>
        <input
          {...register('name')}
          placeholder="e.g., Box A"
          className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={2}
          placeholder="Optional notes about this box"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Capacity (players)</label>
          <input
            {...register('capacity')}
            type="number"
            min={2}
            max={30}
            className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.capacity && <p className="mt-1 text-xs text-red-600">{errors.capacity.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Sport Type</label>
          <select
            {...register('sportType')}
            className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {SPORT_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {BOX_AMENITIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedAmenities?.includes(a)
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          {...register('isActive')}
          type="checkbox"
          id="isActive"
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Box is active (visible to customers)
        </label>
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

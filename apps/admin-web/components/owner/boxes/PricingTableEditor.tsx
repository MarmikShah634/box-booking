'use client'

import { useState } from 'react'
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { formatRupees, rupeesToPaise, paiseToRupees } from '@/lib/utils'

interface PricingBand {
  id: string
  label: string
  startHour: number
  endHour: number
  weekdayPricePaise: number
  weekendPricePaise: number
}

interface PricingTableEditorProps {
  initialBands?: PricingBand[]
  onSave: (bands: PricingBand[]) => Promise<void>
}

function generateId() {
  return Math.random().toString(36).slice(2)
}

function validateCoverage(bands: PricingBand[]): string | null {
  const sorted = [...bands].sort((a, b) => a.startHour - b.startHour)
  if (sorted.length === 0) return 'Add at least one pricing band.'
  for (let i = 0; i < sorted.length - 1; i++) {
    const b = sorted[i]!
    const next = sorted[i + 1]!
    if (b.endHour > next.startHour) return `Bands "${b.label}" and "${next.label}" overlap.`
    if (b.endHour < next.startHour) return `Gap between ${b.endHour}:00 and ${next.startHour}:00.`
  }
  return null
}

export function PricingTableEditor({ initialBands = [], onSave }: PricingTableEditorProps) {
  const [bands, setBands] = useState<PricingBand[]>(
    initialBands.length > 0
      ? initialBands
      : [
          {
            id: generateId(),
            label: 'Morning',
            startHour: 6,
            endHour: 12,
            weekdayPricePaise: 60000,
            weekendPricePaise: 80000,
          },
          {
            id: generateId(),
            label: 'Evening',
            startHour: 12,
            endHour: 22,
            weekdayPricePaise: 80000,
            weekendPricePaise: 100000,
          },
        ],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const updateBand = (id: string, field: keyof PricingBand, value: string | number) => {
    setBands((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              [field]:
                field === 'weekdayPricePaise' || field === 'weekendPricePaise'
                  ? rupeesToPaise(Number(value))
                  : field === 'startHour' || field === 'endHour'
                  ? Number(value)
                  : value,
            }
          : b,
      ),
    )
  }

  const addBand = () => {
    const last = bands[bands.length - 1]
    setBands((prev) => [
      ...prev,
      {
        id: generateId(),
        label: 'New Band',
        startHour: last ? last.endHour : 6,
        endHour: last ? Math.min(last.endHour + 4, 24) : 10,
        weekdayPricePaise: 60000,
        weekendPricePaise: 80000,
      },
    ])
  }

  const removeBand = (id: string) => {
    setBands((prev) => prev.filter((b) => b.id !== id))
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    const validationError = validateCoverage(bands)
    if (validationError) { setError(validationError); return }
    setSaving(true)
    await onSave(bands)
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const hours = Array.from({ length: 25 }, (_, i) => i)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-500">Band Label</th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-500">Start</th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-500">End</th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-500">Weekday ₹/hr</th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-500">Weekend ₹/hr</th>
              <th className="py-2 text-xs font-semibold text-gray-500" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bands.map((band) => (
              <tr key={band.id}>
                <td className="py-2 pr-3">
                  <input
                    value={band.label}
                    onChange={(e) => updateBand(band.id, 'label', e.target.value)}
                    className="h-9 w-28 rounded-md border border-gray-200 px-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </td>
                <td className="py-2 pr-3">
                  <select
                    value={band.startHour}
                    onChange={(e) => updateBand(band.id, 'startHour', e.target.value)}
                    className="h-9 rounded-md border border-gray-200 px-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {hours.slice(0, 24).map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-3">
                  <select
                    value={band.endHour}
                    onChange={(e) => updateBand(band.id, 'endHour', e.target.value)}
                    className="h-9 rounded-md border border-gray-200 px-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {hours.slice(1).map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={paiseToRupees(band.weekdayPricePaise)}
                    onChange={(e) => updateBand(band.id, 'weekdayPricePaise', e.target.value)}
                    className="h-9 w-24 rounded-md border border-gray-200 px-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={paiseToRupees(band.weekendPricePaise)}
                    onChange={(e) => updateBand(band.id, 'weekendPricePaise', e.target.value)}
                    className="h-9 w-24 rounded-md border border-gray-200 px-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => removeBand(band.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Live preview */}
      {bands.length > 0 && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Preview</p>
          <div className="flex flex-wrap gap-2">
            {bands.map((b) => (
              <div key={b.id} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs">
                <span className="font-medium text-gray-700">{b.label}</span>{' '}
                <span className="text-gray-400">{b.startHour}:00–{b.endHour}:00</span>
                <br />
                WD: {formatRupees(b.weekdayPricePaise)}/hr ·{' '}
                WE: {formatRupees(b.weekendPricePaise)}/hr
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          Pricing saved successfully!
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addBand}
          className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:border-emerald-400 hover:text-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add Band
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Pricing'}
        </button>
      </div>
    </div>
  )
}

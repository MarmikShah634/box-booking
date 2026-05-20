'use client'

import { useEffect, useState, useCallback } from 'react'
import { superAdminApi } from '@/lib/api'
import { AlertCircle, Save, Info } from 'lucide-react'

interface PlatformSettingsApi {
  slotHoldTtlMinutes: number
  advancePercent: number
  cancelFullRefundHours: number
  cancelHalfRefundHours: number
  freeModeDbOverride: boolean
  freeModeReason: string
  envFreeModeEnabled: boolean
}

interface SettingsFormValues {
  slotHoldTtlMinutes: number
  advancePercent: number
  cancelFullRefundHours: number
  cancelHalfRefundHours: number
  freeModeDbOverride: boolean
  freeModeReason: string
}

interface ValidationErrors {
  slotHoldTtlMinutes?: string
  advancePercent?: string
  cancelFullRefundHours?: string
  cancelHalfRefundHours?: string
  freeModeReason?: string
}

function validateSettings(vals: SettingsFormValues): ValidationErrors {
  const errors: ValidationErrors = {}
  if (vals.slotHoldTtlMinutes < 1 || vals.slotHoldTtlMinutes > 60) {
    errors.slotHoldTtlMinutes = 'Must be 1–60 minutes'
  }
  if (vals.advancePercent < 10 || vals.advancePercent > 100) {
    errors.advancePercent = 'Must be 10–100%'
  }
  if (vals.cancelFullRefundHours < 1 || vals.cancelFullRefundHours > 168) {
    errors.cancelFullRefundHours = 'Must be 1–168 hours'
  }
  if (vals.cancelHalfRefundHours < 1 || vals.cancelHalfRefundHours >= vals.cancelFullRefundHours) {
    errors.cancelHalfRefundHours = 'Must be less than full-refund hours'
  }
  return errors
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettingsApi | null>(null)
  const [form, setForm] = useState<SettingsFormValues>({
    slotHoldTtlMinutes: 15,
    advancePercent: 20,
    cancelFullRefundHours: 24,
    cancelHalfRefundHours: 12,
    freeModeDbOverride: false,
    freeModeReason: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [reasonDialog, setReasonDialog] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    superAdminApi<PlatformSettingsApi>('/super-admin/settings').then((res) => {
      if (res.ok) {
        setSettings(res.data)
        setForm({
          slotHoldTtlMinutes: res.data.slotHoldTtlMinutes,
          advancePercent: res.data.advancePercent,
          cancelFullRefundHours: res.data.cancelFullRefundHours,
          cancelHalfRefundHours: res.data.cancelHalfRefundHours,
          freeModeDbOverride: res.data.freeModeDbOverride,
          freeModeReason: res.data.freeModeReason,
        })
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSaveClick = () => {
    setSuccess(null)
    setError(null)
    const errs = validateSettings(form)
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs)
      return
    }
    setValidationErrors({})
    setReasonDialog(true)
  }

  const handleSave = async () => {
    if (reason.trim().length < 5) {
      setReasonError('Reason must be at least 5 characters')
      return
    }
    setReasonError(null)
    setSaving(true)
    const res = await superAdminApi<{ message?: string }>('/super-admin/settings', {
      method: 'PATCH',
      actionReason: reason.trim(),
      body: form,
    })
    setSaving(false)
    if (!res.ok) {
      setError(res.error)
      setReasonDialog(false)
      return
    }
    setSuccess(res.data.message ?? 'Settings saved')
    setReasonDialog(false)
    setReason('')
    load()
  }

  const setNum = (field: keyof SettingsFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }))
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Platform Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">All changes are audit-logged and require a reason</p>
      </div>

      {/* Env state warning */}
      {settings && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-800 bg-blue-950/30 px-4 py-3 text-xs text-blue-300">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p>
              <strong>Env state:</strong> PLATFORM_FREE_MODE ={' '}
              <code className={`font-mono ${settings.envFreeModeEnabled ? 'text-red-400' : 'text-green-400'}`}>
                {String(settings.envFreeModeEnabled)}
              </code>
            </p>
            {settings.envFreeModeEnabled && (
              <p className="mt-1 text-yellow-400">
                Env FREE MODE is ON — overrides all DB settings and overrides. Restart API to change.
              </p>
            )}
            <p className="mt-1 text-gray-400">
              DB freeModeDbOverride ={' '}
              <code className="font-mono">{String(settings.freeModeDbOverride)}</code>. Toggle below changes
              it (but env wins if set).
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-800 bg-green-950/40 px-4 py-2 text-xs text-green-400">
          {success}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Booking & Slot Settings */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Booking & Slot</h2>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-300">
              Slot Hold TTL (minutes)
            </label>
            <input
              type="number"
              value={form.slotHoldTtlMinutes}
              onChange={(e) => setNum('slotHoldTtlMinutes', e.target.value)}
              min={1}
              max={60}
              className="h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:border-red-500 focus:outline-none"
            />
            {validationErrors.slotHoldTtlMinutes && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.slotHoldTtlMinutes}</p>
            )}
            <p className="mt-1 text-[10px] text-gray-500">How long a slot is reserved during payment (1–60)</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-300">
              Advance Payment Percent
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.advancePercent}
                onChange={(e) => setNum('advancePercent', e.target.value)}
                min={10}
                max={100}
                className="h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 pr-8 text-sm text-white focus:border-red-500 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
            {validationErrors.advancePercent && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.advancePercent}</p>
            )}
            <p className="mt-1 text-[10px] text-gray-500">% of total booking amount collected upfront (10–100)</p>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cancellation Policy</h2>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-300">
              Full Refund Window (hours before booking)
            </label>
            <input
              type="number"
              value={form.cancelFullRefundHours}
              onChange={(e) => setNum('cancelFullRefundHours', e.target.value)}
              min={1}
              max={168}
              className="h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:border-red-500 focus:outline-none"
            />
            {validationErrors.cancelFullRefundHours && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.cancelFullRefundHours}</p>
            )}
            <p className="mt-1 text-[10px] text-gray-500">Cancel this many hours before → 100% refund (1–168)</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-300">
              Half Refund Window (hours before booking)
            </label>
            <input
              type="number"
              value={form.cancelHalfRefundHours}
              onChange={(e) => setNum('cancelHalfRefundHours', e.target.value)}
              min={1}
              className="h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:border-red-500 focus:outline-none"
            />
            {validationErrors.cancelHalfRefundHours && (
              <p className="mt-1 text-xs text-red-400">{validationErrors.cancelHalfRefundHours}</p>
            )}
            <p className="mt-1 text-[10px] text-gray-500">
              Cancel between half-refund and full-refund window → 50% refund. Must be less than full-refund hours.
            </p>
          </div>
        </div>

        {/* Free Mode */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-4 lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Free Mode (DB Override)</h2>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, freeModeDbOverride: !prev.freeModeDbOverride }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                form.freeModeDbOverride ? 'bg-red-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.freeModeDbOverride ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-gray-300">
              Free Mode {form.freeModeDbOverride ? 'Enabled (DB)' : 'Disabled (DB)'}
            </span>
            {settings?.envFreeModeEnabled && (
              <span className="rounded border border-yellow-700 bg-yellow-950/40 px-2 py-0.5 text-[10px] text-yellow-400">
                ENV overrides this
              </span>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-300">Free Mode Reason</label>
            <input
              type="text"
              value={form.freeModeReason}
              onChange={(e) => setForm((prev) => ({ ...prev, freeModeReason: e.target.value }))}
              placeholder="e.g. Launch promo until Q2"
              className="h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Reason dialog */}
      {reasonDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-white">Confirm Settings Change</h3>
            <p className="mt-1 text-xs text-gray-400">
              Provide a reason for this settings update. It will be recorded in the audit log.
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-300">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Enter reason (min 5 chars)…"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none resize-none"
              />
              {reasonError && <p className="mt-1 text-xs text-red-400">{reasonError}</p>}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => { setReasonDialog(false); setReason(''); setReasonError(null) }}
                className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-red-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

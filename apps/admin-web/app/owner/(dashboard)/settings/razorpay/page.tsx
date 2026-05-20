'use client'

import { useState } from 'react'
import { ShieldAlert, Eye, EyeOff } from 'lucide-react'
import { ownerApi } from '@/lib/api'

interface StepUpState {
  step: 'idle' | 'requesting' | 'verifying' | 'done'
  otp: string
  token: string
  error: string
}

export default function RazorpaySettingsPage() {
  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stepUp, setStepUp] = useState<StepUpState>({ step: 'idle', otp: '', token: '', error: '' })

  const requestStepUp = async () => {
    setStepUp({ step: 'requesting', otp: '', token: '', error: '' })
    const res = await ownerApi('/auth/owner/request-step-up', { method: 'POST', body: { action: 'update_razorpay_keys' } })
    if (res.ok) {
      setStepUp((s) => ({ ...s, step: 'verifying' }))
    } else {
      setStepUp({ step: 'idle', otp: '', token: '', error: res.error })
    }
  }

  const verifyStepUp = async () => {
    const res = await ownerApi<{ stepUpToken: string }>('/auth/owner/verify-step-up', {
      method: 'POST',
      body: { action: 'update_razorpay_keys', otp: stepUp.otp },
    })
    if (res.ok) {
      setStepUp((s) => ({ ...s, step: 'done', token: res.data.stepUpToken }))
    } else {
      setStepUp((s) => ({ ...s, error: res.error }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stepUp.token) { requestStepUp(); return }
    setSaving(true)
    setMessage(null)
    const res = await ownerApi('/owners/me/razorpay-keys', {
      method: 'PUT',
      body: { keyId, keySecret },
      stepUpToken: stepUp.token,
    })
    setSaving(false)
    if (res.ok) {
      setMessage({ type: 'success', text: 'Razorpay keys updated.' })
      setKeyId('')
      setKeySecret('')
      setStepUp({ step: 'idle', otp: '', token: '', error: '' })
    } else {
      setMessage({ type: 'error', text: res.error })
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-amber-100 p-2">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Razorpay Keys</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect your Razorpay account to collect payments directly from customers.
            Keys are stored encrypted and never shown again after save.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-6">
        This action requires step-up verification. An OTP will be sent to your registered email.
      </div>

      {stepUp.step === 'verifying' && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Enter OTP sent to your email</h3>
          <input
            type="text"
            maxLength={6}
            value={stepUp.otp}
            onChange={(e) => setStepUp((s) => ({ ...s, otp: e.target.value }))}
            placeholder="6-digit OTP"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono tracking-widest"
          />
          {stepUp.error && <p className="text-sm text-red-600">{stepUp.error}</p>}
          <button
            onClick={verifyStepUp}
            disabled={stepUp.otp.length !== 6}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            Verify OTP
          </button>
        </div>
      )}

      {stepUp.step === 'done' && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">
          Step-up verified. You may now update your keys.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Key ID</label>
          <input
            type="text"
            value={keyId}
            onChange={(e) => setKeyId(e.target.value)}
            placeholder="rzp_live_XXXXXXXXXX"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Key Secret</label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder="••••••••••••••••"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
        {stepUp.error && stepUp.step === 'idle' && <p className="text-sm text-red-600">{stepUp.error}</p>}
        <button
          type="submit"
          disabled={saving || stepUp.step === 'requesting' || stepUp.step === 'verifying'}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {stepUp.step === 'done' ? (saving ? 'Saving...' : 'Save keys') : 'Continue (step-up required)'}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Building2, ShieldAlert } from 'lucide-react'
import { ownerApi } from '@/lib/api'

interface StepUpState {
  step: 'idle' | 'requesting' | 'verifying' | 'done'
  otp: string
  token: string
  error: string
}

export default function BankSettingsPage() {
  const [accountNumber, setAccountNumber] = useState('')
  const [confirmAccount, setConfirmAccount] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [accountName, setAccountName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stepUp, setStepUp] = useState<StepUpState>({ step: 'idle', otp: '', token: '', error: '' })

  const requestStepUp = async () => {
    setStepUp({ step: 'requesting', otp: '', token: '', error: '' })
    const res = await ownerApi('/auth/owner/request-step-up', { method: 'POST', body: { action: 'update_bank_account' } })
    if (res.ok) {
      setStepUp((s) => ({ ...s, step: 'verifying' }))
    } else {
      setStepUp({ step: 'idle', otp: '', token: '', error: res.error })
    }
  }

  const verifyStepUp = async () => {
    const res = await ownerApi<{ stepUpToken: string }>('/auth/owner/verify-step-up', {
      method: 'POST',
      body: { action: 'update_bank_account', otp: stepUp.otp },
    })
    if (res.ok) {
      setStepUp((s) => ({ ...s, step: 'done', token: res.data.stepUpToken }))
    } else {
      setStepUp((s) => ({ ...s, error: res.error }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (accountNumber !== confirmAccount) {
      setMessage({ type: 'error', text: 'Account numbers do not match.' })
      return
    }
    if (!stepUp.token) { requestStepUp(); return }
    setSaving(true)
    setMessage(null)
    const res = await ownerApi('/owners/me/bank-account', {
      method: 'PUT',
      body: { accountNumber, ifsc: ifsc.toUpperCase(), accountName },
      stepUpToken: stepUp.token,
    })
    setSaving(false)
    if (res.ok) {
      setMessage({ type: 'success', text: 'Bank account updated.' })
      setAccountNumber('')
      setConfirmAccount('')
      setIfsc('')
      setAccountName('')
      setStepUp({ step: 'idle', otp: '', token: '', error: '' })
    } else {
      setMessage({ type: 'error', text: res.error })
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-blue-100 p-2">
          <Building2 className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bank Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update the bank account linked to your Razorpay payouts.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-6 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
        This action requires step-up OTP verification sent to your registered email.
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
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Verify OTP
          </button>
        </div>
      )}

      {stepUp.step === 'done' && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">
          Step-up verified. You may now update your bank account.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {[
          { label: 'Account holder name', value: accountName, setter: setAccountName, placeholder: 'As in bank records', type: 'text' },
          { label: 'Account number', value: accountNumber, setter: setAccountNumber, placeholder: '', type: 'text' },
          { label: 'Confirm account number', value: confirmAccount, setter: setConfirmAccount, placeholder: '', type: 'text' },
          { label: 'IFSC code', value: ifsc, setter: setIfsc, placeholder: 'HDFC0001234', type: 'text' },
        ].map(({ label, value, setter, placeholder, type }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <input
              type={type}
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={placeholder}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        ))}
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={saving || stepUp.step === 'requesting' || stepUp.step === 'verifying'}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {stepUp.step === 'done' ? (saving ? 'Saving...' : 'Save bank account') : 'Continue (step-up required)'}
        </button>
      </form>
    </div>
  )
}

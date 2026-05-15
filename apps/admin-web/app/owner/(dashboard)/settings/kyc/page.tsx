'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, AlertTriangle, Clock } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import type { Owner } from '@/types'

interface KycFormData {
  panNumber: string
  panName: string
  aadhaarNumber: string
  gstNumber: string
  bankAccountNumber: string
  bankIfsc: string
  bankAccountName: string
}

const INITIAL: KycFormData = {
  panNumber: '',
  panName: '',
  aadhaarNumber: '',
  gstNumber: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankAccountName: '',
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  pending: {
    icon: <Clock className="h-5 w-5" />,
    label: 'Not submitted',
    color: 'text-gray-600',
    bg: 'bg-gray-50 border-gray-200',
  },
  submitted: {
    icon: <Clock className="h-5 w-5" />,
    label: 'Under review',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
  verified: {
    icon: <ShieldCheck className="h-5 w-5" />,
    label: 'Verified',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  rejected: {
    icon: <AlertTriangle className="h-5 w-5" />,
    label: 'Rejected — please resubmit',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
  },
}

export default function KycPage() {
  const [owner, setOwner] = useState<Owner | null>(null)
  const [form, setForm] = useState<KycFormData>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    ownerApi<Owner>('/owners/me').then((res) => {
      if (res.ok) setOwner(res.data)
    })
  }, [])

  const handleChange = (field: keyof KycFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    const body = {
      panNumber: form.panNumber.toUpperCase(),
      panName: form.panName,
      aadhaarNumber: form.aadhaarNumber || undefined,
      gstNumber: form.gstNumber || undefined,
      bankAccountNumber: form.bankAccountNumber,
      bankIfsc: form.bankIfsc.toUpperCase(),
      bankAccountName: form.bankAccountName,
    }
    const res = await ownerApi('/owners/me/kyc', { method: 'POST', body })
    setSubmitting(false)
    if (res.ok) {
      setMessage({ type: 'success', text: 'KYC submitted successfully. Our team will review within 1–2 business days.' })
      setOwner((prev) => prev ? { ...prev, kycStatus: 'submitted' } : prev)
    } else {
      setMessage({ type: 'error', text: res.error })
    }
  }

  const kycStatus = owner?.kycStatus ?? 'pending'
  const statusConfig = STATUS_CONFIG[kycStatus] ?? STATUS_CONFIG.pending!
  const canEdit = kycStatus === 'pending' || kycStatus === 'rejected'

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-2">KYC Verification</h1>
      <p className="text-sm text-gray-500 mb-6">Required to receive payouts from Razorpay.</p>

      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-6 ${statusConfig.bg} ${statusConfig.color}`}>
        {statusConfig.icon}
        <span className="text-sm font-medium">{statusConfig.label}</span>
      </div>

      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {[
            { field: 'panNumber' as const, label: 'PAN Number', placeholder: 'ABCDE1234F', required: true },
            { field: 'panName' as const, label: 'Name on PAN', placeholder: 'As printed on your PAN card', required: true },
            { field: 'aadhaarNumber' as const, label: 'Aadhaar Number (optional)', placeholder: 'XXXX XXXX XXXX', required: false },
            { field: 'gstNumber' as const, label: 'GST Number (optional)', placeholder: '22AAAAA0000A1Z5', required: false },
            { field: 'bankAccountNumber' as const, label: 'Bank Account Number', placeholder: '', required: true },
            { field: 'bankIfsc' as const, label: 'IFSC Code', placeholder: 'HDFC0001234', required: true },
            { field: 'bankAccountName' as const, label: 'Account Holder Name', placeholder: 'As in bank records', required: true },
          ].map(({ field, label, placeholder, required }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input
                type="text"
                value={form[field]}
                onChange={handleChange(field)}
                placeholder={placeholder}
                required={required}
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
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit KYC'}
          </button>
        </form>
      )}

      {!canEdit && kycStatus === 'verified' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          Your KYC is verified. Contact support if you need to update your details.
        </div>
      )}
    </div>
  )
}

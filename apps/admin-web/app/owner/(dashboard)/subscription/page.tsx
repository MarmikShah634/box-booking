'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Crown } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import type { Subscription, SubscriptionPlan } from '@/types'
import { formatRupees } from '@/lib/utils'

function PlanCard({ plan, current, onUpgrade }: { plan: SubscriptionPlan; current?: Subscription; onUpgrade: (planId: string) => void }) {
  const isActive = current?.plan === plan.name && current?.status === 'active'
  return (
    <div className={`rounded-xl border-2 p-5 ${isActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{plan.displayName}</h3>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {formatRupees(plan.pricePaise)}<span className="text-sm font-normal text-gray-500">/{plan.billingCycle}</span>
          </p>
        </div>
        {isActive && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
            <CheckCircle className="h-3.5 w-3.5" /> Active
          </span>
        )}
      </div>
      <ul className="space-y-2 mb-5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            {f}
          </li>
        ))}
        <li className="text-sm text-gray-500">Up to {plan.maxVenues} venues, {plan.maxBoxesPerVenue} boxes each</li>
        <li className="text-sm text-gray-500">{plan.commissionPercent}% platform commission</li>
      </ul>
      {!isActive && (
        <button
          onClick={() => onUpgrade(plan.id)}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Upgrade to {plan.displayName}
        </button>
      )}
    </div>
  )
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      ownerApi<SubscriptionPlan[]>('/subscriptions/plans'),
      ownerApi<Subscription | null>('/subscriptions/mine'),
    ]).then(([plansRes, subRes]) => {
      if (plansRes.ok) setPlans(plansRes.data)
      if (subRes.ok && subRes.data) setSubscription(subRes.data)
      setLoading(false)
    })
  }, [])

  const handleUpgrade = async (planId: string) => {
    const res = await ownerApi<{ paymentUrl?: string }>('/subscriptions/subscribe', {
      method: 'POST',
      body: { planId },
    })
    if (res.ok && res.data.paymentUrl) {
      window.location.href = res.data.paymentUrl
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Crown className="h-6 w-6 text-emerald-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subscription</h1>
          {subscription && (
            <p className="text-sm text-gray-500 mt-0.5">
              Current plan: <span className="font-medium text-gray-700 capitalize">{subscription.plan}</span>
              {' · '}Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={subscription ?? undefined}
            onUpgrade={handleUpgrade}
          />
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Payments via Razorpay. Cancel anytime. No refunds on partial months.
      </p>
    </div>
  )
}

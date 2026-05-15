import { paiseToRupees } from '@/lib/currency'

interface PriceBreakdownProps {
  totalPaise: number
  advancePaise: number
  balancePaise?: number
  label?: string
}

export function PriceBreakdown({ totalPaise, advancePaise, label = 'Slot price' }: PriceBreakdownProps) {
  const balancePaise = totalPaise - advancePaise

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Price breakdown</h4>
      </div>
      <div className="px-4 divide-y divide-zinc-100 dark:divide-zinc-800">
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{paiseToRupees(totalPaise)}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Advance (pay now)</span>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{paiseToRupees(advancePaise)}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Balance (pay at venue)</span>
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{paiseToRupees(balancePaise)}</span>
        </div>
      </div>
    </div>
  )
}

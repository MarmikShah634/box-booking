import { paiseToRupees } from '@/lib/currency'

export interface PricingSlot {
  label: string
  startTime: string
  endTime: string
  weekdayPaise: number
  weekendPaise: number
}

interface PricingTableProps {
  slots: PricingSlot[]
}

export function PricingTable({ slots }: PricingTableProps) {
  if (slots.length === 0) return null

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[360px]" role="table">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Time band
            </th>
            <th className="text-right py-2.5 px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Weekday
            </th>
            <th className="text-right py-2.5 px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Weekend
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {slots.map((slot) => (
            <tr key={slot.label} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <td className="py-3 px-3">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{slot.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {slot.startTime} – {slot.endTime}
                </p>
              </td>
              <td className="py-3 px-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                {paiseToRupees(slot.weekdayPaise)}
                <span className="text-xs font-normal text-zinc-400">/hr</span>
              </td>
              <td className="py-3 px-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                {paiseToRupees(slot.weekendPaise)}
                <span className="text-xs font-normal text-zinc-400">/hr</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

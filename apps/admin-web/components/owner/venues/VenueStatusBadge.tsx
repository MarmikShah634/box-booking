import { cn } from '@/lib/utils'
import type { Venue } from '@/types'

type Status = Venue['status']

const statusConfig: Record<Status, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  suspended: { label: 'Suspended', className: 'bg-orange-100 text-orange-700' },
}

export function VenueStatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}

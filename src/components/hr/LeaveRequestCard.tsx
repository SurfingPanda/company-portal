import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RequestStatus } from '@/components/forms/RequestStatus'
import { formatDate } from '@/lib/format'
import { formatDateRange } from '@/lib/leave'
import type { LeaveRequest } from '@/types/hr'

/** Compact mobile entry for one leave request. */
export function LeaveRequestCard({ request }: { request: LeaveRequest }) {
  return (
    <Link
      to={`/hr/leave/requests/${request.id}`}
      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-xs text-muted-foreground">{request.reference}</span>
        <span className="mt-0.5 block text-sm font-semibold text-primary">{request.leaveType}</span>
        <span className="block text-xs text-muted-foreground">{formatDateRange(request.startDate, request.endDate)}</span>
        <span className="block text-xs text-muted-foreground">{request.submittedAt ? `Submitted ${formatDate(request.submittedAt)}` : 'Not yet submitted'}</span>
        <RequestStatus status={request.status} className="mt-2" />
      </span>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

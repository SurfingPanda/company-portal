import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RelativeTime } from '@/components/common/RelativeTime'
import { TicketStatus } from '@/components/helpdesk/TicketStatus'
import { getTicketCategoryLabel } from '@/data/helpdeskOptions'
import type { HelpdeskTicket } from '@/types/helpdesk'

/** Compact ticket entry for small screens: reference, subject, status, category and last update. */
export function TicketCard({ ticket }: { ticket: HelpdeskTicket }) {
  return (
    <Link
      to={`/helpdesk/tickets/${ticket.id}`}
      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-xs text-muted-foreground">{ticket.reference}</span>
        <span className="mt-0.5 block text-sm font-semibold text-primary">{ticket.subject}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <TicketStatus status={ticket.status} />
          <span className="text-xs text-muted-foreground">{getTicketCategoryLabel(ticket.category)}</span>
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          Updated <RelativeTime iso={ticket.updatedAt} />
        </span>
      </span>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

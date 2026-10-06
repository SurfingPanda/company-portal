import { Link } from 'react-router-dom'
import { RelativeTime } from '@/components/common/RelativeTime'
import { TicketPriority } from '@/components/helpdesk/TicketPriority'
import { TicketStatus } from '@/components/helpdesk/TicketStatus'
import { TableCell, TableRow } from '@/components/ui/table'
import { getTicketCategoryLabel } from '@/data/helpdeskOptions'
import { formatDate } from '@/lib/format'
import type { HelpdeskTicket } from '@/types/helpdesk'

/** Table row (md and up). */
export function TicketRow({ ticket }: { ticket: HelpdeskTicket }) {
  return (
    <TableRow className="hover:bg-accent">
      <TableCell className="whitespace-nowrap font-mono text-xs">{ticket.reference}</TableCell>
      <TableCell className="whitespace-normal">
        <Link to={`/helpdesk/tickets/${ticket.id}`} className="text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {ticket.subject}
        </Link>
      </TableCell>
      <TableCell className="hidden text-sm lg:table-cell">{getTicketCategoryLabel(ticket.category)}</TableCell>
      <TableCell>
        <TicketStatus status={ticket.status} />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <TicketPriority priority={ticket.priority} />
      </TableCell>
      <TableCell className="hidden whitespace-nowrap text-sm tabular-nums text-muted-foreground xl:table-cell">{formatDate(ticket.createdAt)}</TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        <RelativeTime iso={ticket.updatedAt} />
      </TableCell>
    </TableRow>
  )
}

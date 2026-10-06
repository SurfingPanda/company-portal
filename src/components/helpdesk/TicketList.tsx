import { TicketCard } from '@/components/helpdesk/TicketCard'
import { TicketRow } from '@/components/helpdesk/TicketRow'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { HelpdeskTicket } from '@/types/helpdesk'

const head = 'h-10 text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground'

/** Table on md+ screens, compact cards below. */
export function TicketList({ tickets, busy }: { tickets: HelpdeskTicket[]; busy?: boolean }) {
  return (
    <div className={cn('border bg-white transition-opacity', busy && 'opacity-60')} aria-busy={busy}>
      <ul className="divide-y md:hidden" aria-label="Tickets">
        {tickets.map((t) => (
          <li key={t.id}>
            <TicketCard ticket={t} />
          </li>
        ))}
      </ul>
      <Table className="hidden md:table">
        <TableHeader className="bg-secondary">
          <TableRow className="hover:bg-secondary">
            <TableHead className={head}>Reference</TableHead>
            <TableHead className={head}>Subject</TableHead>
            <TableHead className={cn(head, 'hidden lg:table-cell')}>Category</TableHead>
            <TableHead className={head}>Status</TableHead>
            <TableHead className={cn(head, 'hidden lg:table-cell')}>Priority</TableHead>
            <TableHead className={cn(head, 'hidden xl:table-cell')}>Created</TableHead>
            <TableHead className={head}>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((t) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

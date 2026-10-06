import { Link } from 'react-router-dom'
import { RequestStatus } from '@/components/forms/RequestStatus'
import { LeaveRequestCard } from '@/components/hr/LeaveRequestCard'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { LeaveRequest } from '@/types/hr'

const head = 'h-10 text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground'

/** Table on md+ screens, compact cards below. */
export function LeaveRequestList({ requests, busy }: { requests: LeaveRequest[]; busy?: boolean }) {
  return (
    <div className={cn('border bg-white transition-opacity', busy && 'opacity-60')} aria-busy={busy}>
      <ul className="divide-y md:hidden" aria-label="My leave requests">
        {requests.map((r) => (
          <li key={r.id}>
            <LeaveRequestCard request={r} />
          </li>
        ))}
      </ul>

      <Table className="hidden md:table">
        <TableHeader className="bg-secondary">
          <TableRow className="hover:bg-secondary">
            <TableHead className={head}>Reference</TableHead>
            <TableHead className={head}>Leave Type</TableHead>
            <TableHead className={head}>Date From</TableHead>
            <TableHead className={head}>Date To</TableHead>
            <TableHead className={cn(head, 'hidden lg:table-cell')}>Submitted</TableHead>
            <TableHead className={head}>Status</TableHead>
            <TableHead className={cn(head, 'text-right')}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r.id} className="hover:bg-accent">
              <TableCell className="font-mono text-xs">{r.reference}</TableCell>
              <TableCell className="whitespace-normal">
                <Link to={`/hr/leave/requests/${r.id}`} className="text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  {r.leaveType}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm tabular-nums">{formatDate(r.startDate)}</TableCell>
              <TableCell className="whitespace-nowrap text-sm tabular-nums">{formatDate(r.endDate)}</TableCell>
              <TableCell className="hidden whitespace-nowrap text-sm tabular-nums text-muted-foreground lg:table-cell">{r.submittedAt ? formatDate(r.submittedAt) : 'Not submitted'}</TableCell>
              <TableCell>
                <RequestStatus status={r.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm" className="bg-white">
                  <Link to={`/hr/leave/requests/${r.id}`} aria-label={`View leave request ${r.reference}`}>
                    View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

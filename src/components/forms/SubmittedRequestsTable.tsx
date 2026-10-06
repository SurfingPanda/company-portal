import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RequestStatus } from '@/components/forms/RequestStatus'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getRequestCategoryLabel } from '@/data/requestCategories'
import { formatDate } from '@/lib/format'
import type { EmployeeRequest } from '@/types/request'

const head = 'h-10 text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground'

/** Table on md+ screens; compact cards below. */
export function SubmittedRequestsTable({ requests }: { requests: EmployeeRequest[] }) {
  return (
    <div className="border bg-white">
      <ul className="divide-y md:hidden" aria-label="My requests">
        {requests.map((r) => (
          <li key={r.id}>
            <Link
              to={`/requests/${r.id}`}
              className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xs text-muted-foreground">{r.reference}</span>
                <span className="mt-0.5 block text-sm font-semibold text-primary">{r.requestTypeTitle}</span>
                <span className="block text-xs text-muted-foreground">
                  {getRequestCategoryLabel(r.category)} · Submitted {formatDate(r.submittedAt)}
                </span>
                <RequestStatus status={r.status} className="mt-2" />
              </span>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <Table className="hidden md:table">
        <TableHeader className="bg-secondary">
          <TableRow className="hover:bg-secondary">
            <TableHead className={head}>Reference</TableHead>
            <TableHead className={head}>Request</TableHead>
            <TableHead className={`${head} hidden lg:table-cell`}>Category</TableHead>
            <TableHead className={head}>Submitted</TableHead>
            <TableHead className={head}>Status</TableHead>
            <TableHead className={`${head} hidden lg:table-cell`}>Last Updated</TableHead>
            <TableHead className={`${head} text-right`}>
              <span className="sr-only">Action</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r.id} className="hover:bg-accent">
              <TableCell className="font-mono text-xs">{r.reference}</TableCell>
              <TableCell className="whitespace-normal">
                <Link to={`/requests/${r.id}`} className="text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  {r.requestTypeTitle}
                </Link>
                {r.title !== r.requestTypeTitle && <p className="line-clamp-1 text-xs text-muted-foreground">{r.title}</p>}
              </TableCell>
              <TableCell className="hidden text-sm lg:table-cell">{getRequestCategoryLabel(r.category)}</TableCell>
              <TableCell className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">{formatDate(r.submittedAt)}</TableCell>
              <TableCell>
                <RequestStatus status={r.status} />
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-sm tabular-nums text-muted-foreground lg:table-cell">{formatDate(r.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm" className="bg-white">
                  <Link to={`/requests/${r.id}`} aria-label={`View request ${r.reference}`}>
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

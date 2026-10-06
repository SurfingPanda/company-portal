import { Link } from 'react-router-dom'
import { ApplicationCard } from '@/components/recruitment/ApplicationCard'
import { ApplicationStatus } from '@/components/recruitment/ApplicationStatus'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Application } from '@/types/recruitment'

const head = 'h-10 text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground'

/** Table on md+ screens, compact cards below. */
export function ApplicationList({ applications, busy }: { applications: Application[]; busy?: boolean }) {
  return (
    <div className={cn('border bg-white transition-opacity', busy && 'opacity-60')} aria-busy={busy}>
      <ul className="divide-y md:hidden" aria-label="My applications">
        {applications.map((a) => (
          <li key={a.id}>
            <ApplicationCard application={a} />
          </li>
        ))}
      </ul>

      <Table className="hidden md:table">
        <TableHeader className="bg-secondary">
          <TableRow className="hover:bg-secondary">
            <TableHead className={head}>Reference</TableHead>
            <TableHead className={head}>Position</TableHead>
            <TableHead className={head}>Submitted</TableHead>
            <TableHead className={head}>Status</TableHead>
            <TableHead className={cn(head, 'hidden lg:table-cell')}>Last Updated</TableHead>
            <TableHead className={cn(head, 'text-right')}>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((a) => (
            <TableRow key={a.id} className="hover:bg-accent">
              <TableCell className="font-mono text-xs">{a.reference}</TableCell>
              <TableCell className="whitespace-normal">
                <Link to={`/recruitment/applications/${a.id}`} className="text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  {a.jobTitle}
                </Link>
                <p className="text-xs text-muted-foreground">{a.department}</p>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">{a.submittedAt ? formatDate(a.submittedAt) : 'Not submitted'}</TableCell>
              <TableCell>
                <ApplicationStatus status={a.status} />
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-sm tabular-nums text-muted-foreground lg:table-cell">{formatDate(a.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm" className="bg-white">
                  <Link to={`/recruitment/applications/${a.id}`} aria-label={`View application ${a.reference}`}>
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

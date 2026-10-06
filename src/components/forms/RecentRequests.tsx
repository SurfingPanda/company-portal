import { Link } from 'react-router-dom'
import { SectionHeading, SectionLink } from '@/components/common/SectionHeading'
import { RequestStatus } from '@/components/forms/RequestStatus'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getRecentRequests } from '@/services/requestService'

interface RecentRequestsProps {
  title?: string
  headingId?: string
  /** Optional section number for the home page headings. */
  number?: string
  limit?: number
}

/** Compact list of the employee's latest requests. Shared by the Home page and the Forms page. */
export function RecentRequests({ title = 'My Recent Requests', headingId = 'recent-requests-heading', number, limit = 3 }: RecentRequestsProps) {
  const { data, error, retry } = useAsync(() => getRecentRequests(limit), [limit])

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId} number={number} title={title} action={<SectionLink href="/requests">View All Requests</SectionLink>} />
      {error ? (
        <div role="alert" className="border bg-white px-4 py-5 text-sm">
          <p className="font-semibold text-primary">Unable to load requests</p>
          <button type="button" onClick={retry} className="mt-1 text-primary underline underline-offset-4">
            Retry
          </button>
        </div>
      ) : !data ? (
        <div role="status" aria-label="Loading requests" className="space-y-px">
          {Array.from({ length: limit }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-none" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="border bg-white px-4 py-6 text-center text-sm text-muted-foreground">You have not submitted any requests yet.</p>
      ) : (
        <ul className="bg-white ring-1 ring-border">
          {data.map((r) => (
            <li key={r.id} className="border-b border-border last:border-b-0">
              <Link
                to={`/requests/${r.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-primary">{r.requestTypeTitle}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{r.reference}</span>
                </span>
                <RequestStatus status={r.status} className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

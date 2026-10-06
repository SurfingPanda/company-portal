import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { JobStatus } from '@/components/recruitment/JobStatus'
import { formatDate } from '@/lib/format'
import type { JobOpening } from '@/types/recruitment'

/** Compact job entry used on mobile, and in the Home and landing lists. */
export function JobCard({ job }: { job: JobOpening }) {
  return (
    <Link
      to={`/recruitment/jobs/${job.id}`}
      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-primary">{job.title}</span>
          {job.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {job.department} · {job.employmentType} · {job.location}
        </span>
        <span className="block text-xs text-muted-foreground">
          {job.workArrangement} · Posted {formatDate(job.postedAt)}
          {job.closingDate ? ` · Closes ${formatDate(job.closingDate)}` : ''}
        </span>
        <JobStatus status={job.status} className="mt-2" />
      </span>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

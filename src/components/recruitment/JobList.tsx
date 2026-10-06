import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { JobCard } from '@/components/recruitment/JobCard'
import { JobStatus } from '@/components/recruitment/JobStatus'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { JobOpening } from '@/types/recruitment'

/** Structured list on md+ screens (title and details on the left, dates and action on the right); compact cards below. */
export function JobList({ jobs, busy }: { jobs: JobOpening[]; busy?: boolean }) {
  return (
    <div className={cn('border bg-white transition-opacity', busy && 'opacity-60')} aria-busy={busy}>
      <ul className="divide-y md:hidden" aria-label="Job openings">
        {jobs.map((job) => (
          <li key={job.id}>
            <JobCard job={job} />
          </li>
        ))}
      </ul>

      <ul className="hidden divide-y md:block" aria-label="Job openings">
        {jobs.map((job) => (
          <li key={job.id} className="grid grid-cols-[1fr_auto] items-start gap-6 px-5 py-4 hover:bg-accent/50">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="font-serif text-lg font-semibold leading-tight text-primary">
                  <Link to={`/recruitment/jobs/${job.id}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    {job.title}
                  </Link>
                </h3>
                {job.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
                <JobStatus status={job.status} />
              </div>
              <p className="mt-0.5 text-sm text-foreground/80">
                {job.department} · {job.employmentType} · {job.workArrangement} · {job.location}
              </p>
              <p className="mt-1 text-[0.8125rem] text-muted-foreground">{job.summary}</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <p className="text-xs text-muted-foreground">
                Posted {formatDate(job.postedAt)}
                {job.closingDate && <span className="block">Closes {formatDate(job.closingDate)}</span>}
              </p>
              <Button asChild variant="outline" size="sm" className="bg-white text-primary">
                <Link to={`/recruitment/jobs/${job.id}`} aria-label={`View position: ${job.title}`}>
                  View Position
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

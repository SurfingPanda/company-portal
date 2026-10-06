import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApplicationStatus } from '@/components/recruitment/ApplicationStatus'
import { formatDate } from '@/lib/format'
import type { Application } from '@/types/recruitment'

/** Compact mobile entry for one application. */
export function ApplicationCard({ application }: { application: Application }) {
  return (
    <Link
      to={`/recruitment/applications/${application.id}`}
      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-xs text-muted-foreground">{application.reference}</span>
        <span className="mt-0.5 block text-sm font-semibold text-primary">{application.jobTitle}</span>
        <span className="block text-xs text-muted-foreground">{application.submittedAt ? `Submitted ${formatDate(application.submittedAt)}` : 'Not yet submitted'}</span>
        <ApplicationStatus status={application.status} className="mt-2" />
      </span>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

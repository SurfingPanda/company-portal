import { useEffect, useRef } from 'react'
import { CircleCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApplicationStatus } from '@/components/recruitment/ApplicationStatus'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import type { Application, Referral } from '@/types/recruitment'

type Props = { kind: 'application'; record: Application } | { kind: 'referral'; record: Referral }

/** Confirmation after a (mock) application or referral. Clearly marked as demo data. */
export function SubmissionSuccess(props: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const isApplication = props.kind === 'application'
  const record = props.record
  const submitted = record.submittedAt

  return (
    <section aria-labelledby="submission-success-heading" className="border border-t-2 border-border border-t-primary bg-white p-6 sm:p-8">
      <div role="status" className="flex items-start gap-3">
        <CircleCheck className="mt-1 size-6 shrink-0 text-gold" aria-hidden="true" />
        <div>
          <h2 id="submission-success-heading" ref={headingRef} tabIndex={-1} className="font-serif text-2xl font-semibold text-primary focus:outline-none">
            {isApplication ? 'Application Submitted' : 'Referral Submitted'}
          </h2>
          <p className="mt-1 text-sm text-foreground/80">{isApplication ? 'Your application has been recorded.' : 'Your referral has been recorded.'}</p>
        </div>
      </div>

      <dl className="mt-6 grid max-w-xl gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isApplication ? 'Application Reference' : 'Referral Reference'}</dt>
          <dd className="mt-1 font-mono text-lg font-semibold text-primary">{record.reference}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Position</dt>
          <dd className="mt-1 text-sm">{record.jobTitle}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submission Date</dt>
          <dd className="mt-1 text-sm">{submitted ? formatDate(submitted, 'long') : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Status</dt>
          <dd className="mt-1">{isApplication ? <ApplicationStatus status={(record as Application).status} /> : <span className="text-sm">Submitted</span>}</dd>
        </div>
      </dl>

      <p className="mt-6 border border-dashed border-muted-foreground/40 px-3 py-2 text-xs text-muted-foreground">
        Demo data: this {isApplication ? 'application' : 'referral'} is kept in this browser session only and has not been sent to a recruitment system. The file was not uploaded.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {isApplication && (
          <Button asChild>
            <Link to={`/recruitment/applications/${record.id}`}>View this Application</Link>
          </Button>
        )}
        <Button asChild variant={isApplication ? 'outline' : 'default'} className={isApplication ? 'bg-white' : undefined}>
          <Link to="/recruitment/jobs">Back to Job Openings</Link>
        </Button>
        {isApplication && (
          <Button asChild variant="outline" className="bg-white">
            <Link to="/recruitment/applications">My Applications</Link>
          </Button>
        )}
      </div>
    </section>
  )
}

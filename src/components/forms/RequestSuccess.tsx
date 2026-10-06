import { useEffect, useRef } from 'react'
import { CircleCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RequestStatus } from '@/components/forms/RequestStatus'
import { Button } from '@/components/ui/button'
import type { EmployeeRequest } from '@/types/request'

/** Confirmation shown after a (mock) submission. */
export function RequestSuccess({ request }: { request: EmployeeRequest }) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="request-success-heading" className="border border-t-2 border-border border-t-primary bg-white p-6 sm:p-8">
      <div role="status" className="flex items-start gap-3">
        <CircleCheck className="mt-1 size-6 shrink-0 text-gold" aria-hidden="true" />
        <div>
          <h2 id="request-success-heading" ref={headingRef} tabIndex={-1} className="font-serif text-2xl font-semibold text-primary focus:outline-none">
            Request Submitted
          </h2>
          <p className="mt-1 text-sm text-foreground/80">Request submitted successfully. Your request has been recorded.</p>
        </div>
      </div>

      <dl className="mt-6 grid max-w-md gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference Number</dt>
          <dd className="mt-1 font-mono text-lg font-semibold text-primary">{request.reference}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <RequestStatus status={request.status} />
          </dd>
        </div>
      </dl>

      <p className="mt-6 border border-dashed border-muted-foreground/40 px-3 py-2 text-xs text-muted-foreground">
        Prototype: this request is kept in this browser session only and has not been sent to a server. A later phase will store it through Laravel.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/requests">View My Requests</Link>
        </Button>
        <Button asChild variant="outline" className="bg-white">
          <Link to={`/requests/${request.id}`}>View this Request</Link>
        </Button>
        <Button asChild variant="outline" className="bg-white">
          <Link to="/forms">Back to Forms &amp; Requests</Link>
        </Button>
      </div>
    </section>
  )
}

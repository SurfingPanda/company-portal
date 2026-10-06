import { Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HR_MANAGED_NOTE } from '@/lib/user'

/** Sample request types for changing HR-managed information. They are configured in the Phase 8 request catalog. */
const requestLinks = [
  { label: 'Contact Information Update', href: '/forms/rt-contact-update' },
  { label: 'Employee Information Correction', href: '/forms/rt-info-correction' },
  { label: 'Employment Record Inquiry', href: '/forms/rt-records-inquiry' },
  { label: 'Other HR Information Request', href: '/forms/rt-other-info' },
]

/** Small note that HR owns certain fields. */
export function HrManagedNote({ className }: { className?: string }) {
  return (
    <p role="note" className={`flex items-start gap-2 text-xs text-muted-foreground ${className ?? ''}`}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      {HR_MANAGED_NOTE}
    </p>
  )
}

/**
 * "Need to update official employee information?" Employees cannot edit these records themselves: they use the
 * existing request system, and HR updates the record in the portal.
 */
export function EmployeeInformationRequests() {
  return (
    <section aria-labelledby="official-info-heading" className="border border-l-4 border-l-primary bg-white p-5">
      <h2 id="official-info-heading" className="font-serif text-xl font-semibold text-primary">
        Need to update official employee information?
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/85">
        Information such as your employee ID, department, position, employment status, and other HR-managed records are maintained by HR. Send HR a request to have them corrected or updated.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link to="/forms?category=hr">Submit an HR Request</Link>
        </Button>
      </div>

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request an Information Update</h3>
      <ul className="mt-2 grid gap-x-6 sm:grid-cols-2" aria-label="Employee information requests">
        {requestLinks.map((r) => (
          <li key={r.href} className="border-b border-border">
            <Link to={r.href} className="block py-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
              {r.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Sample request types. Some corrections may need a supporting document; see the{' '}
        <Link to="/forms/form-data-update" className="text-primary underline-offset-4 hover:underline">
          Employee Data Update Form
        </Link>{' '}
        or{' '}
        <Link to="/documents?category=hr" className="text-primary underline-offset-4 hover:underline">
          HR documents
        </Link>
        . Track your requests under{' '}
        <Link to="/requests?category=hr" className="text-primary underline-offset-4 hover:underline">
          My Requests
        </Link>
        .
      </p>
    </section>
  )
}

import { ArrowLeft, Paperclip } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { RequestStatus } from '@/components/forms/RequestStatus'
import { RequestTimeline } from '@/components/forms/RequestTimeline'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTime } from '@/lib/format'
import { formatDateRange } from '@/lib/leave'
import type { LeaveRequest } from '@/types/hr'

const headingClass = 'border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary'

function Rows({ items, labelWidth = '8rem' }: { items: { label: string; value: React.ReactNode }[]; labelWidth?: string }) {
  return (
    <dl>
      {items.map((item) => (
        <div key={item.label} className="grid gap-3 border-b border-border py-2.5" style={{ gridTemplateColumns: `${labelWidth} 1fr` }}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 whitespace-pre-line break-words text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Leave request detail. Shows only what was submitted; status wording comes from the shared request statuses. */
export function LeaveRequestDetail({ request }: { request: LeaveRequest }) {
  const details = [
    { label: 'Leave Type', value: request.leaveType },
    { label: 'Date Range', value: formatDateRange(request.startDate, request.endDate) },
    { label: 'Reason', value: request.reason },
    { label: 'Contact Number', value: request.contactNumber ?? 'Not provided' },
    { label: 'Email', value: request.contactEmail ?? 'Not provided' },
  ]
  const info = [
    { label: 'Reference', value: <span className="font-mono">{request.reference}</span> },
    { label: 'Status', value: <RequestStatus status={request.status} /> },
    { label: 'Submitted', value: request.submittedAt ? formatDate(request.submittedAt, 'long') : 'Not yet submitted' },
    { label: 'Last Updated', value: formatDateTime(request.updatedAt) },
    ...(request.assignedDepartment ? [{ label: 'Handled By', value: request.assignedDepartment }] : []),
  ]

  return (
    <div className="space-y-8">
      <header className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <RequestStatus status={request.status} />
          {request.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-primary">{request.leaveType} Request</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{request.reference}</p>
        <p className="mt-1 text-sm text-muted-foreground">{formatDateRange(request.startDate, request.endDate)}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section aria-labelledby="leave-details-heading">
            <h2 id="leave-details-heading" className={headingClass}>
              Leave Details
            </h2>
            <Rows items={details} />
          </section>

          <section aria-labelledby="leave-attachment-heading">
            <h2 id="leave-attachment-heading" className={headingClass}>
              Attachment
            </h2>
            {request.attachmentName ? (
              <ul className="mt-3 divide-y border bg-white">
                <li className="flex items-center gap-2 px-3 py-2.5 text-sm">
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate font-medium">{request.attachmentName}</span>
                  {request.attachmentSize && <span className="shrink-0 text-xs text-muted-foreground">{request.attachmentSize}</span>}
                </li>
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No attachment.</p>
            )}
          </section>

          <Button asChild variant="outline" className="bg-white">
            <Link to="/hr/leave/requests">
              <ArrowLeft aria-hidden="true" /> Back to My Leave Requests
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          <section aria-labelledby="leave-info-heading">
            <h2 id="leave-info-heading" className={headingClass}>
              Request Information
            </h2>
            <Rows items={info} labelWidth="7rem" />
          </section>

          <section aria-labelledby="leave-timeline-heading">
            <h2 id="leave-timeline-heading" className={headingClass}>
              Request Timeline
            </h2>
            <div className="mt-4">
              <RequestTimeline entries={request.timeline} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

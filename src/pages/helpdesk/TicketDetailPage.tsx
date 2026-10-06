import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { HelpdeskErrorState, SampleHelpdeskNotice } from '@/components/helpdesk/HelpdeskStates'
import { TicketAttachments } from '@/components/helpdesk/TicketAttachments'
import { TicketPriority } from '@/components/helpdesk/TicketPriority'
import { TicketReplyForm } from '@/components/helpdesk/TicketReplyForm'
import { TicketStatus } from '@/components/helpdesk/TicketStatus'
import { TicketTimeline } from '@/components/helpdesk/TicketTimeline'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { RelativeTime } from '@/components/common/RelativeTime'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getTicketCategoryLabel, getTicketTypeLabel } from '@/data/helpdeskOptions'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { formatDate } from '@/lib/format'
import { addActivity } from '@/services/notificationService'
import { cancelTicket, getTicket, replyToTicket } from '@/services/helpdeskService'
import type { HelpdeskTicket } from '@/types/helpdesk'

const headingClass = 'border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary'

function NotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Ticket Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The ticket you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/helpdesk/tickets">
          <ArrowLeft aria-hidden="true" /> Back to My Tickets
        </Link>
      </Button>
    </div>
  )
}

function TicketDetail({ ticket: initial }: { ticket: HelpdeskTicket }) {
  const [ticket, setTicket] = useState(initial)
  const reply = useMutation((input: { message: string; file?: File }) => replyToTicket(ticket.id, input))
  const cancel = useMutation(() => cancelTicket(ticket.id))
  const closed = ticket.status === 'closed' || ticket.status === 'cancelled'
  const canCancel = ['new', 'open', 'pending'].includes(ticket.status)

  const handleSend = async (input: { message: string; attachment?: { name: string; size: number }; file?: File }) => {
    const updated = await reply.mutate({ message: input.message, file: input.file })
    if (updated) {
      setTicket(updated)
      void addActivity({ action: 'Replied to IT ticket', description: ticket.reference, type: 'request', href: `/helpdesk/tickets/${ticket.id}` })
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this ticket?')) return
    const updated = await cancel.mutate(undefined)
    if (updated) setTicket(updated)
  }

  const details: { label: string; value?: string }[] = [
    { label: 'Type', value: getTicketTypeLabel(ticket.type) },
    { label: 'Category', value: getTicketCategoryLabel(ticket.category) },
    { label: 'Handled By', value: ticket.handledBy ?? ticket.assignedTo },
    { label: 'Location', value: ticket.location },
    { label: 'Device', value: ticket.deviceType },
    { label: 'Operating System', value: ticket.operatingSystem },
    { label: 'Asset Tag', value: ticket.assetTag },
  ]

  return (
    <div className="space-y-8">
      <header className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{ticket.reference}</span>
          <TicketStatus status={ticket.status} label={ticket.statusLabel} />
          <TicketPriority priority={ticket.priority} />
          {ticket.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </div>
        <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-primary">{ticket.subject}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{getTicketCategoryLabel(ticket.category)}</span>
          <span>
            Created <time dateTime={ticket.createdAt}>{formatDate(ticket.createdAt, 'long')}</time>
          </span>
          <span>
            Last updated <RelativeTime iso={ticket.updatedAt} />
          </span>
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section aria-labelledby="issue-heading">
            <h2 id="issue-heading" className={headingClass}>
              Issue Description
            </h2>
            <p className="mt-3 max-w-2xl whitespace-pre-line text-[0.9375rem] leading-relaxed text-foreground/85">{ticket.description}</p>
          </section>

          <section aria-labelledby="activity-heading">
            <h2 id="activity-heading" className={headingClass}>
              Ticket Activity
            </h2>
            <div className="mt-4">
              <TicketTimeline entries={ticket.activity} />
            </div>
          </section>

          <section aria-labelledby="reply-heading">
            <h2 id="reply-heading" className={headingClass}>
              Reply
            </h2>
            <div className="mt-4">
              {closed ? (
                <p className="border bg-white px-4 py-3 text-sm text-muted-foreground">
                  This ticket is {ticket.status}. <Link to="/helpdesk/new" className="text-primary underline-offset-4 hover:underline">Submit a new request</Link> if you need more help.
                </p>
              ) : (
                <>
                  <TicketReplyForm onSend={handleSend} sending={reply.submitting} error={reply.error} />
                  {canCancel && (
                    <div className="mt-3">
                      <Button type="button" variant="outline" className="bg-white" onClick={handleCancel} disabled={cancel.submitting}>
                        {cancel.submitting ? 'Cancelling…' : 'Cancel Ticket'}
                      </Button>
                      {cancel.error && (
                        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
                          {cancel.error}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section aria-labelledby="details-heading">
            <h2 id="details-heading" className={headingClass}>
              Ticket Details
            </h2>
            <dl>
              {details.map((d) => (
                <div key={d.label} className="grid grid-cols-[8rem_1fr] gap-3 border-b border-border py-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d.label}</dt>
                  <dd className={d.value ? 'text-sm' : 'text-sm italic text-muted-foreground'}>{d.value ?? 'Not provided'}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="attachments-heading">
            <h2 id="attachments-heading" className={headingClass}>
              Attachments
            </h2>
            <div className="mt-3">
              <TicketAttachments attachments={ticket.attachments} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function TicketDetailPage() {
  const { ticketId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getTicket(ticketId), [ticketId])

  const trail = [{ label: 'IT Helpdesk', href: '/helpdesk' }, { label: 'My Tickets', href: '/helpdesk/tickets' }, { label: data ? data.reference : loading ? 'Loading…' : 'Not found' }]

  let content
  if (error) content = <HelpdeskErrorState onRetry={retry} />
  else if (loading && !data)
    content = (
      <div role="status" aria-label="Loading ticket" className="space-y-6">
        <Skeleton className="h-28 rounded-sm" />
        <Skeleton className="h-64 rounded-sm" />
      </div>
    )
  else if (!data) content = <NotFound />
  else content = <TicketDetail key={data.id} ticket={data} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {data && <SampleHelpdeskNotice className="mb-6" />}
      {content}
    </PageContainer>
  )
}

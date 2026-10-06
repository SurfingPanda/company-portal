import { useEffect, useRef, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HelpdeskPageShell } from '@/components/helpdesk/HelpdeskPageShell'
import { SampleHelpdeskNotice } from '@/components/helpdesk/HelpdeskStates'
import { TicketForm } from '@/components/helpdesk/TicketForm'
import { TicketStatus } from '@/components/helpdesk/TicketStatus'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/context/NotificationContext'
import { addActivity } from '@/services/notificationService'
import type { HelpdeskTicket } from '@/types/helpdesk'

function TicketSuccess({ ticket }: { ticket: HelpdeskTicket }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="ticket-success-heading" className="border border-t-2 border-border border-t-primary bg-white p-6 sm:p-8">
      <div role="status" className="flex items-start gap-3">
        <CircleCheck className="mt-1 size-6 shrink-0 text-gold" aria-hidden="true" />
        <div>
          <h2 id="ticket-success-heading" ref={headingRef} tabIndex={-1} className="font-serif text-2xl font-semibold text-primary focus:outline-none">
            Request Submitted
          </h2>
          <p className="mt-1 text-sm text-foreground/80">Your IT support request has been submitted.</p>
        </div>
      </div>
      <dl className="mt-6 grid max-w-md gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference</dt>
          <dd className="mt-1 font-mono text-lg font-semibold text-primary">{ticket.reference}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <TicketStatus status={ticket.status} />
          </dd>
        </div>
      </dl>
      <p className="mt-6 border border-dashed border-muted-foreground/40 px-3 py-2 text-xs text-muted-foreground">
        Prototype: this sample ticket is kept in this browser session only. It has not been sent to the company&apos;s ticketing system.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link to={`/helpdesk/tickets/${ticket.id}`}>View Ticket</Link>
        </Button>
        <Button asChild variant="outline" className="bg-white">
          <Link to="/helpdesk">Return to Helpdesk</Link>
        </Button>
      </div>
    </section>
  )
}

export default function NewTicketPage() {
  const [created, setCreated] = useState<HelpdeskTicket>()
  const { addNotification } = useNotifications()

  // Demonstrates ticket -> notification and activity: a real backend would create both when it stores the ticket.
  const handleCreated = (ticket: HelpdeskTicket) => {
    setCreated(ticket)
    addNotification({ title: 'Ticket Created', message: `Your IT support request ${ticket.reference} has been submitted.`, type: 'it', href: `/helpdesk/tickets/${ticket.id}`, relatedId: ticket.id })
    void addActivity({ action: 'Submitted IT ticket', description: ticket.reference, type: 'request', href: `/helpdesk/tickets/${ticket.id}` })
  }

  return (
    <HelpdeskPageShell title="Submit a Request" description="Tell IT what you need. Include as much detail as you can." trail={[{ label: 'Submit a Request' }]}>
      <div className="space-y-6">
        <SampleHelpdeskNotice />
        {created ? (
          <TicketSuccess ticket={created} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TicketForm onCreated={handleCreated} />
            </div>
            <aside className="space-y-4 self-start">
              <div className="border bg-white p-5 text-sm">
                <h2 className="font-serif text-lg font-semibold text-primary">Before you submit</h2>
                <p className="mt-1 text-muted-foreground">Many problems have a quick fix.</p>
                <Link to="/helpdesk/knowledge-base" className="mt-2 inline-block font-medium text-primary underline-offset-4 hover:underline">
                  Search the Knowledge Base
                </Link>
              </div>
              <div className="border bg-white p-5 text-sm">
                <h2 className="font-serif text-lg font-semibold text-primary">Other employee requests</h2>
                <p className="mt-1 text-muted-foreground">Looking for another employee request?</p>
                <Link to="/forms" className="mt-2 inline-block font-medium text-primary underline-offset-4 hover:underline">
                  View Forms &amp; Requests
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </HelpdeskPageShell>
  )
}

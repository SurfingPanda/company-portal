import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminFilters } from '@/components/admin/AdminFilters'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminList } from '@/hooks/useAdminList'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { formatDateTime } from '@/lib/format'
import { claimTicket, getAdminTicket, getHublyStatus, retryHubly, getAdminTickets, replyToTicketAsStaff, updateTicket } from '@/services/admin/adminApi'
import type { AdminRecord } from '@/types/admin'

const opt = (values: string[]) => values.map((value) => ({ value, label: value.replace(/^./, (c) => c.toUpperCase()) }))
const s = (r: AdminRecord, k: string) => String(r[k] ?? '')
const STATUSES = ['new', 'open', 'pending', 'resolved', 'closed', 'cancelled']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']

export function AdminTicketsListPage() {
  const list = useAdminList<AdminRecord>(getAdminTickets, ['status', 'priority', 'category', 'assigned'], { sort: 'updated_at', direction: 'desc' })
  const columns: AdminColumn<AdminRecord>[] = [
    { key: 'number', header: 'Ticket', render: (r) => <Link to={`/admin/helpdesk/tickets/${r.id}`} className="font-mono text-primary underline-offset-2 hover:underline">{s(r, 'ticket_number')}</Link> },
    { key: 'subject', header: 'Subject', render: (r) => <span className="font-medium">{s(r, 'subject')}</span> },
    { key: 'requester', header: 'Requester', render: (r) => s(r, 'requester') || '—' },
    { key: 'assigned', header: 'Assigned to', render: (r) => s(r, 'assigned_to') || 'Unassigned' },
    { key: 'priority', header: 'Priority', sortKey: 'priority', render: (r) => <StatusBadge value={s(r, 'priority')} /> },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => <StatusBadge value={s(r, 'status')} /> },
    { key: 'updated', header: 'Updated', sortKey: 'updated_at', render: (r) => formatDateTime(s(r, 'updated_at')) },
  ]
  return (
    <>
      <AdminPageHeader title="Helpdesk tickets" description="All IT tickets, visible to the IT team. Take ownership of an unassigned ticket, change priority and status, and reply." trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Helpdesk' }]} />
      <AdminFilters search={list.search} searchLabel="Search number or subject" values={list.params} onChange={list.update}
        filters={[{ key: 'assigned', label: 'Ownership', options: [{ value: 'unassigned', label: 'Unassigned' }, { value: 'me', label: 'Assigned to me' }] }, { key: 'status', label: 'Status', options: opt(STATUSES) }, { key: 'priority', label: 'Priority', options: opt(PRIORITIES) }, { key: 'category', label: 'Category', options: opt(['hardware', 'software', 'network', 'account', 'email', 'printer', 'security', 'other']) }]} />
      <AdminTable caption="Helpdesk tickets" columns={columns} page={list.data} loading={list.loading} error={list.error} onRetry={list.retry} rowKey={(r) => r.id}
        sort={String(list.params.sort ?? '')} direction={list.params.direction as 'asc' | 'desc' | undefined}
        onSort={(key) => list.update({ sort: key, direction: list.params.sort === key && list.params.direction === 'asc' ? 'desc' : 'asc' })}
        onPage={(page) => list.update({ page: String(page) })} emptyTitle="No tickets found" emptyHint="No tickets match the filters." />
    </>
  )
}

function TicketHandling({ initial }: { initial: AdminRecord }) {
  const [ticket, setTicket] = useState(initial)
  const [status, setStatus] = useState(s(initial, 'status'))
  const [priority, setPriority] = useState(s(initial, 'priority'))
  const [assignee, setAssignee] = useState(s(initial, 'assigned_to'))
  const [reply, setReply] = useState('')
  const save = useMutation((body: { status: string; priority: string; assigned_to: string | null }) => updateTicket(Number(ticket.id), body))
  const claim = useMutation((_: void) => claimTicket(Number(ticket.id)))
  const send = useMutation((message: string) => replyToTicketAsStaff(Number(ticket.id), message))
  const replies = (ticket.replies ?? []) as AdminRecord[]
  const attachments = (ticket.attachments ?? []) as AdminRecord[]
  const closed = ['closed', 'cancelled'].includes(s(ticket, 'status'))
  // When the Hubly link is on, Hubly is the master: this page is read-only and updates arrive from there.
  const hubly = useAsync(getHublyStatus, [])
  const managed = hubly.data?.enabled === true
  const retry = useMutation((_: void) => retryHubly())

  const reload = async () => setTicket(await getAdminTicket(ticket.id))
  const take = async () => {
    const updated = await claim.mutate()
    if (updated) {
      setTicket(await getAdminTicket(ticket.id))
      setStatus(s(updated, 'status'))
      setAssignee(s(updated, 'assigned_to'))
    }
  }
  const apply = async () => {
    if (await save.mutate({ status, priority, assigned_to: assignee.trim() || null })) await reload()
  }
  const sendReply = async () => {
    if (await send.mutate(reply.trim())) {
      setReply('')
      await reload()
    }
  }

  return (
    <>
      <AdminPageHeader title={s(ticket, 'ticket_number')} description={s(ticket, 'subject')} trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Helpdesk', href: '/admin/helpdesk/tickets' }, { label: s(ticket, 'ticket_number') }]} />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section aria-labelledby="t-h">
            <h2 id="t-h" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Issue</h2>
            <p className="mt-3 whitespace-pre-line break-words text-sm">{s(ticket, 'description')}</p>
            <p className="mt-2 text-xs text-muted-foreground">Requester {s(ticket, 'requester')} · {s(ticket, 'category')} · {s(ticket, 'type')} · created {formatDateTime(s(ticket, 'created_at'))}</p>
          </section>
          <section aria-labelledby="a-h">
            <h2 id="a-h" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Attachments</h2>
            {attachments.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No attachments.</p> : (
              <ul className="mt-2 divide-y border bg-white">{attachments.map((a) => <li key={s(a, 'id')} className="px-3 py-2 text-sm">{s(a, 'filename')} <span className="text-xs text-muted-foreground">{s(a, 'mime_type')} · {Math.max(1, Math.round(Number(a.file_size) / 1024))} KB</span></li>)}</ul>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Attachment download is not available yet (files are stored privately; an authorized download endpoint comes later).</p>
          </section>
          <section aria-labelledby="r-h">
            <h2 id="r-h" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Conversation</h2>
            <ul className="mt-2 divide-y border bg-white">
              {replies.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground">No replies yet.</li>}
              {replies.map((r) => <li key={s(r, 'id')} className="px-3 py-2 text-sm"><p className="text-xs text-muted-foreground">{s(r, 'author')} · {formatDateTime(s(r, 'created_at'))}</p><p className="mt-1 whitespace-pre-line break-words">{s(r, 'message')}</p></li>)}
            </ul>
            {managed ? <p className="mt-3 text-sm text-muted-foreground">Replies and notes are written in Hubly and appear here.</p> : closed ? <p className="mt-3 text-sm text-muted-foreground">This ticket is {s(ticket, 'status')}. Reopen it to reply.</p> : (
              <div className="mt-3 space-y-2">
                {send.error && <p role="alert" className="text-sm text-destructive">{send.fieldErrors.message ?? send.error}</p>}
                <label htmlFor="staff-reply" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reply to the requester</label>
                <textarea id="staff-reply" value={reply} rows={4} maxLength={5000} onChange={(e) => setReply(e.target.value)} className="w-full border border-input bg-white p-2 text-sm" />
                <Button type="button" disabled={reply.trim().length < 2 || send.submitting} onClick={sendReply}>{send.submitting ? 'Sending…' : 'Send reply'}</Button>
              </div>
            )}
          </section>
        </div>

        <aside aria-labelledby="h-h" className="space-y-3">
          <h2 id="h-h" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Handling</h2>
          {managed && (
            <div className="space-y-2 border bg-white p-3 text-sm">
              <p className="font-medium">Handled in Hubly{s(ticket, 'external_id') ? ` (${s(ticket, 'external_id')})` : ''}</p>
              <p className="text-muted-foreground">Status: <strong>{s(ticket, 'status_label') || s(ticket, 'status')}</strong>{s(ticket, 'handled_by') ? <> · Handled by {s(ticket, 'handled_by')}</> : null}</p>
              <p className="text-xs text-muted-foreground">Change the status, priority, owner and notes in Hubly. They appear here and the employee is notified.</p>
              {(hubly.data?.waiting ?? 0) + (hubly.data?.failed ?? 0) > 0 && (
                <div className="border-t pt-2 text-xs">
                  <p className="text-amber-700">{hubly.data?.waiting} waiting to reach Hubly, {hubly.data?.failed} gave up.{hubly.data?.last_error ? ` Last problem: ${hubly.data.last_error}` : ''}</p>
                  <Button type="button" size="sm" variant="outline" className="mt-1 bg-white" disabled={retry.submitting} onClick={async () => { await retry.mutate(); hubly.retry() }}>{retry.submitting ? 'Trying…' : 'Try again now'}</Button>
                </div>
              )}
            </div>
          )}
          {!managed && !closed && !s(ticket, 'assigned_to') && (
            <Button type="button" className="w-full" disabled={claim.submitting} onClick={take}>{claim.submitting ? 'Taking…' : 'Take ownership'}</Button>
          )}
          {!managed && claim.error && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">{claim.error}</p>}
          {!managed && save.error && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">{save.fieldErrors.assigned_to ?? save.error}</p>}
          {!managed && <>
          <label htmlFor="t-status" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
          <select id="t-status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-full border border-input bg-white px-2 text-sm">{STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <label htmlFor="t-priority" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</label>
          <select id="t-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="h-9 w-full border border-input bg-white px-2 text-sm">{PRIORITIES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <label htmlFor="t-assignee" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned to (employee ID)</label>
          <input id="t-assignee" value={assignee} maxLength={32} onChange={(e) => setAssignee(e.target.value)} placeholder="Unassigned" className="h-9 w-full border border-input bg-white px-2 text-sm" />
          <p className="text-xs text-muted-foreground">The assignee must be a portal user who can handle tickets. Resolving or closing notifies the requester; choose Open to reopen.</p>
          <Button type="button" className="w-full" disabled={save.submitting} onClick={apply}>{save.submitting ? 'Saving…' : 'Save changes'}</Button>
          </>}
        </aside>
      </div>
    </>
  )
}

export function AdminTicketDetailPage() {
  const { ticketId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getAdminTicket(ticketId), [ticketId])
  if (error) return <div role="alert" className="border border-destructive/40 bg-destructive/5 p-6 text-sm"><p className="font-semibold text-destructive">Unable to load this ticket.</p><p className="mt-1 text-muted-foreground">{error.message}</p><Button type="button" variant="outline" size="sm" className="mt-3 bg-white" onClick={retry}>Try again</Button></div>
  if (loading || !data) return <Skeleton className="h-96 max-w-4xl" />
  return <TicketHandling initial={data} />
}

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminFilters } from '@/components/admin/AdminFilters'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthorization } from '@/auth/useAuthorization'
import { useAdminList } from '@/hooks/useAdminList'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { formatDateTime } from '@/lib/format'
import { getAdminRequest, getReviewRequests, setRequestStatus } from '@/services/admin/adminApi'
import type { AdminRecord } from '@/types/admin'

const opt = (values: string[]) => values.map((value) => ({ value, label: value.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) }))
const s = (r: AdminRecord, k: string) => String(r[k] ?? '')

/** The moves staff may make; the same table the backend enforces (RequestService). Anything else is rejected with 409. */
const TRANSITIONS: Record<string, string[]> = {
  submitted: ['under-review', 'approved', 'rejected', 'completed'],
  'under-review': ['approved', 'rejected', 'completed'],
  approved: ['completed'],
}

export function AdminRequestsListPage() {
  const list = useAdminList<AdminRecord>(getReviewRequests, ['status', 'category', 'requester', 'from', 'to'], { sort: 'created_at', direction: 'desc' })
  const columns: AdminColumn<AdminRecord>[] = [
    { key: 'reference', header: 'Reference', sortKey: 'reference_number', render: (r) => <Link to={`/admin/requests/${r.id}`} className="font-mono text-primary underline-offset-2 hover:underline">{s(r, 'reference_number')}</Link> },
    { key: 'subject', header: 'Subject', render: (r) => <span className="font-medium">{s(r, 'subject')}</span> },
    { key: 'type', header: 'Type', render: (r) => s((r.request_type ?? {}) as AdminRecord, 'name') },
    { key: 'requester', header: 'Requester', render: (r) => s(r, 'requester') || '—' },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => <StatusBadge value={s(r, 'status')} /> },
    { key: 'created', header: 'Created', sortKey: 'created_at', render: (r) => formatDateTime(s(r, 'created_at')) },
  ]
  return (
    <>
      <AdminPageHeader title="Requests" description="Employee requests you are allowed to review. HR sees HR-type requests, IT sees IT-type requests, department approvers see their routed requests; administrators see all." trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Requests' }]} />
      <AdminFilters
        search={list.search}
        searchLabel="Search reference or subject"
        filters={[
          { key: 'status', label: 'Status', options: opt(['draft', 'submitted', 'under-review', 'approved', 'rejected', 'completed', 'cancelled']) },
          { key: 'category', label: 'Category', options: opt(['hr', 'benefits', 'recruitment', 'it', 'administration', 'other']) },
          { key: 'requester', label: 'Requester ID', options: [], type: 'text' },
          { key: 'from', label: 'From', options: [], type: 'date' },
          { key: 'to', label: 'To', options: [], type: 'date' },
        ]}
        values={list.params}
        onChange={list.update}
      />
      <AdminTable caption="Requests to review" columns={columns} page={list.data} loading={list.loading} error={list.error} onRetry={list.retry} rowKey={(r) => r.id}
        sort={String(list.params.sort ?? '')} direction={list.params.direction as 'asc' | 'desc' | undefined}
        onSort={(key) => list.update({ sort: key, direction: list.params.sort === key && list.params.direction === 'asc' ? 'desc' : 'asc' })}
        onPage={(page) => list.update({ page: String(page) })} emptyTitle="No requests found" emptyHint="No requests match the filters, or none are waiting for you." />
    </>
  )
}

function RequestReview({ initial }: { initial: AdminRecord }) {
  const [request, setRequest] = useState(initial)
  const [status, setStatus] = useState('')
  const [comment, setComment] = useState('')
  const [internal, setInternal] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const change = useMutation((body: { status: string; comment?: string; internal?: boolean }) => setRequestStatus(Number(request.id), body))

  const { hasAnyPermission } = useAuthorization()
  // Laravel enforces the same rules. HR and administrators make any move; a department approver cannot complete; IT staff work
  // IT-type requests, but when the type needs approval and an approver exists, IT only reviews and then fulfils once it is approved.
  const type = (request.request_type ?? {}) as AdminRecord
  const full = hasAnyPermission(['requests.manage']) || (hasAnyPermission(['requests.hr-review']) && ['hr', 'benefits', 'recruitment'].includes(s(type, 'category')))
  const itStaff = hasAnyPermission(['requests.it-review']) && s(type, 'category') === 'it'
  const approvalFirst = itStaff && Boolean(type.requires_approval) && Boolean(request.has_approver ?? true)
  const current = s(request, 'status')
  const allowed = (TRANSITIONS[current] ?? []).filter((t) => {
    if (full) return true
    if (itStaff && !approvalFirst) return true
    if (itStaff) return t === 'under-review' || (t === 'completed' && current === 'approved')
    return t !== 'completed'
  })
  const formData = (request.form_data ?? {}) as Record<string, unknown>
  const history = (request.history ?? []) as AdminRecord[]

  const apply = async () => {
    const updated = await change.mutate({ status, comment: comment.trim() || undefined, internal })
    if (updated) {
      setRequest(await getAdminRequest(request.id))
      setStatus('')
      setComment('')
      setInternal(false)
      setConfirm(false)
    }
  }

  return (
    <>
      <AdminPageHeader title={s(request, 'reference_number')} description={s(request, 'subject')} trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Requests', href: '/admin/requests' }, { label: s(request, 'reference_number') }]} />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section aria-labelledby="req-h">
            <h2 id="req-h" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Request</h2>
            <dl>
              {[['Status', <StatusBadge key="s" value={s(request, 'status')} />], ['Type', s((request.request_type ?? {}) as AdminRecord, 'name')], ['Requester (employee ID)', s(request, 'requester') || '—'], ['Priority', s(request, 'priority')], ['Submitted', request.submitted_at ? formatDateTime(s(request, 'submitted_at')) : '—'], ['Description', s(request, 'description') || '—'],
                ...Object.entries(formData).map(([k, v]) => [k.replace(/[-_]/g, ' '), String(v)])].map(([k, v]) => (
                <div key={String(k)} className="grid grid-cols-[11rem_1fr] gap-3 border-b py-2.5 text-sm"><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt><dd className="whitespace-pre-line break-words">{v}</dd></div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="hist-h">
            <h2 id="hist-h" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">History</h2>
            <ul className="mt-2 divide-y border bg-white">
              {history.map((h) => (
                <li key={s(h, 'id')} className="px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge value={s(h, 'status')} /><time className="text-xs text-muted-foreground">{formatDateTime(s(h, 'created_at'))}</time></div>
                  {s(h, 'comment') && <p className="mt-1 whitespace-pre-line">{s(h, 'comment')}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground">{s(h, 'actor')}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside aria-labelledby="move-h" className="space-y-3">
          <h2 id="move-h" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Change status</h2>
          {allowed.length === 0 ? (
            <p className="text-sm text-muted-foreground">This request is {s(request, 'status')}. No further status changes are possible.</p>
          ) : (
            <>
              {change.error && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">{change.fieldErrors.status ?? change.error}</p>}
              <label htmlFor="new-status" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">New status</label>
              <select id="new-status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-full border border-input bg-white px-2 text-sm">
                <option value="">Choose…</option>
                {allowed.map((a) => <option key={a} value={a}>{a.replace(/-/g, ' ')}</option>)}
              </select>
              <label htmlFor="status-comment" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comment</label>
              <textarea id="status-comment" value={comment} maxLength={2000} rows={4} onChange={(e) => setComment(e.target.value)} className="w-full border border-input bg-white p-2 text-sm" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="size-4 accent-primary" /> Internal note (hidden from the employee)</label>
              <Button type="button" className="w-full" disabled={!status || change.submitting} onClick={() => (status === 'rejected' ? setConfirm(true) : void apply())}>{change.submitting ? 'Saving…' : 'Update status'}</Button>
            </>
          )}
        </aside>
      </div>
      <ConfirmDialog open={confirm} title="Reject this request?" reversible={false} confirmLabel="Reject request" busy={change.submitting} error={change.error} onCancel={() => setConfirm(false)} onConfirm={() => void apply()}>
        <p>Request <strong>{s(request, 'reference_number')}</strong> will be marked rejected and the employee will be notified. A rejected request cannot be moved again.</p>
      </ConfirmDialog>
    </>
  )
}

export function AdminRequestDetailPage() {
  const { requestId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getAdminRequest(requestId), [requestId])
  if (error) return <div role="alert" className="border border-destructive/40 bg-destructive/5 p-6 text-sm"><p className="font-semibold text-destructive">Unable to load this request.</p><p className="mt-1 text-muted-foreground">{error.message}</p><Button type="button" variant="outline" size="sm" className="mt-3 bg-white" onClick={retry}>Try again</Button></div>
  if (loading || !data) return <Skeleton className="h-96 max-w-4xl" />
  return <RequestReview initial={data} />
}

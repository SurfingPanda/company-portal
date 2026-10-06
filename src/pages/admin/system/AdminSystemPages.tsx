import { useEffect, useState, type FormEvent } from 'react'
import { AdminField, type FieldDef } from '@/components/admin/AdminField'
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
import { adminApi, getAuditLog, getSettings, saveSettings, sendNotification } from '@/services/admin/adminApi'
import type { AdminRecord, AuditEntry } from '@/types/admin'

// --- Activity log -------------------------------------------------------------------------------------------------------
const MODULES = ['users', 'announcements', 'calendar', 'documents', 'forms', 'requests', 'helpdesk', 'benefits', 'resources', 'recruitment', 'notifications', 'settings']

/** Read-only audit trail. Records can be searched and filtered but never edited or deleted. */
export function ActivityLogPage() {
  const list = useAdminList<AuditEntry>(getAuditLog, ['module', 'action', 'actor', 'result', 'from', 'to'], { sort: 'created_at', direction: 'desc' })
  const columns: AdminColumn<AuditEntry>[] = [
    { key: 'at', header: 'Date and time', sortKey: 'created_at', className: 'whitespace-nowrap', render: (e) => <time dateTime={e.created_at}>{formatDateTime(e.created_at)}</time> },
    { key: 'actor', header: 'Actor', render: (e) => e.actor ?? 'System' },
    { key: 'action', header: 'Action', render: (e) => <code className="text-xs">{e.action}</code> },
    { key: 'module', header: 'Module', render: (e) => e.module },
    { key: 'target', header: 'Target', render: (e) => e.target ?? '—' },
    { key: 'result', header: 'Result', render: (e) => <StatusBadge value={e.result} /> },
    { key: 'ip', header: 'IP address', render: (e) => e.ip_address ?? '—' },
    { key: 'details', header: 'Details', render: (e) => (e.details ? <span className="font-mono text-xs text-muted-foreground">{Object.entries(e.details).map(([k, v]) => `${k}=${String(v)}`).join(' ')}</span> : '—') },
  ]
  return (
    <>
      <AdminPageHeader title="Activity log" description="Important administrative actions. The log is append-only: entries cannot be edited or deleted." trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Activity log' }]} />
      <AdminFilters
        search={list.search}
        searchLabel="Search action or target"
        filters={[
          { key: 'module', label: 'Module', options: MODULES.map((m) => ({ value: m, label: m })) },
          { key: 'actor', label: 'Actor ID', options: [], type: 'text' },
          { key: 'result', label: 'Result', options: ['success', 'denied', 'failed'].map((v) => ({ value: v, label: v })) },
          { key: 'from', label: 'From', options: [], type: 'date' },
          { key: 'to', label: 'To', options: [], type: 'date' },
        ]}
        values={list.params}
        onChange={list.update}
      />
      <AdminTable caption="Audit log" columns={columns} page={list.data} loading={list.loading} error={list.error} onRetry={list.retry} rowKey={(e) => e.id}
        sort="created_at" direction={list.params.direction as 'asc' | 'desc' | undefined}
        onSort={() => list.update({ sort: 'created_at', direction: list.params.direction === 'asc' ? 'desc' : 'asc' })}
        onPage={(page) => list.update({ page: String(page) })} emptyTitle="No activity recorded" emptyHint="Nothing matches these filters." />
    </>
  )
}

// --- Notifications ------------------------------------------------------------------------------------------------------
const typeOptions = ['announcement', 'request', 'event', 'document', 'system', 'hr', 'it'].map((v) => ({ value: v, label: v.toUpperCase() === 'HR' || v === 'it' ? v.toUpperCase() : v[0].toUpperCase() + v.slice(1) }))
const notificationFields: FieldDef[] = [
  { name: 'type', label: 'Type', kind: 'select', required: true, options: typeOptions },
  { name: 'title', label: 'Title', kind: 'text', required: true, maxLength: 150 },
  { name: 'message', label: 'Message', kind: 'textarea', required: true, maxLength: 1000, rows: 4 },
  { name: 'link', label: 'Link to portal content (optional)', kind: 'text', maxLength: 300, help: 'A portal path such as /announcements/1. External addresses are rejected.' },
  { name: 'audience', label: 'Audience', kind: 'select', required: true, options: [{ value: 'all', label: 'All active employees' }, { value: 'role', label: 'Everyone with a role' }, { value: 'user', label: 'One employee' }] },
  { name: 'role', label: 'Role', kind: 'select', options: ['employee', 'manager', 'hr', 'it', 'admin'].map((v) => ({ value: v, label: v })) },
  { name: 'employee_id', label: 'Employee ID', kind: 'text', maxLength: 32 },
]

/** Send an in-portal notification. In-portal only: no email, SMS or push exists, and each employee's own notification preferences still apply. */
export function AdminNotificationsPage() {
  const [values, setValues] = useState<Record<string, string>>({ type: 'system', title: '', message: '', link: '', audience: 'all', role: '', employee_id: '' })
  const [done, setDone] = useState<number | null>(null)
  const sent = useAdminList<AuditEntry>((p) => adminApi.list<AuditEntry>('/api/admin/notifications', p))
  const send = useMutation(async (v: Record<string, string>) => {
    const body: Record<string, unknown> = { type: v.type, title: v.title.trim(), message: v.message.trim(), audience: v.audience }
    if (v.link.trim()) body.link = v.link.trim()
    if (v.audience === 'role') body.role = v.role
    if (v.audience === 'user') body.employee_id = v.employee_id.trim()
    return (await sendNotification(body)).data.delivered
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setDone(null)
    const delivered = await send.mutate(values)
    if (delivered !== undefined) {
      setDone(delivered)
      setValues((p) => ({ ...p, title: '', message: '', link: '' }))
      sent.retry()
    }
  }

  const visible = notificationFields.filter((f) => (f.name === 'role' ? values.audience === 'role' : f.name === 'employee_id' ? values.audience === 'user' : true))
  const columns: AdminColumn<AuditEntry>[] = [
    { key: 'at', header: 'Sent', render: (e) => formatDateTime(e.created_at) },
    { key: 'title', header: 'Title', render: (e) => <span className="font-medium">{e.target}</span> },
    { key: 'by', header: 'Sent by', render: (e) => e.actor ?? '—' },
    { key: 'aud', header: 'Audience', render: (e) => String(e.details?.audience ?? '') },
    { key: 'n', header: 'Delivered', render: (e) => String(e.details?.delivered ?? '') },
  ]

  return (
    <>
      <AdminPageHeader title="Notifications" description="Send an in-portal notification. Email, SMS and push are not part of the portal yet." trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Notifications' }]} />
      <div className="grid gap-8 xl:grid-cols-2">
        <form onSubmit={submit} noValidate aria-label="Send notification" className="space-y-4 border bg-white p-5">
          {done !== null && <p role="status" className="border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">Sent to {done} {done === 1 ? 'employee' : 'employees'}. Employees who turned this type off are skipped.</p>}
          {send.error && Object.keys(send.fieldErrors).length === 0 && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{send.error}</p>}
          {visible.map((f) => <AdminField key={f.name} def={f} value={values[f.name]} error={send.fieldErrors[f.name]} disabled={send.submitting} onChange={(v) => setValues((p) => ({ ...p, [f.name]: String(v) }))} />)}
          <Button type="submit" disabled={send.submitting}>{send.submitting ? 'Sending…' : 'Send notification'}</Button>
        </form>
        <section aria-labelledby="sent-h">
          <h2 id="sent-h" className="mb-3 border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Recently sent</h2>
          <AdminTable caption="Sent notifications" columns={columns} page={sent.data} loading={sent.loading} error={sent.error} onRetry={sent.retry} rowKey={(e) => e.id} onPage={(page) => sent.update({ page: String(page) })} emptyTitle="Nothing sent yet" emptyHint="Notifications you send appear here." />
        </section>
      </div>
    </>
  )
}

// --- Settings -----------------------------------------------------------------------------------------------------------
const settingKinds: Record<string, FieldDef['kind']> = { support_email: 'email', default_page_size: 'number', remember_search_history_default: 'select' }

/** Portal-level settings only. Secrets (passwords, keys) are never part of this page. Every change is recorded in the activity log. */
export function AdminSettingsPage() {
  const { data, error, loading, retry } = useAsync(getSettings, [])
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  useEffect(() => { if (data) setValues(Object.fromEntries(Object.entries(data.data).map(([k, v]) => [k, v ?? '']))) }, [data])
  const save = useMutation((body: Record<string, string | null>) => saveSettings(body))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaved(false)
    const body = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()]))
    if (await save.mutate(body)) setSaved(true)
  }

  return (
    <>
      <AdminPageHeader title="Settings" description="Portal settings and links to company systems. Do not enter passwords, API keys or other secrets here." trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Settings' }]} />
      {error ? <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-semibold text-destructive">Unable to load settings.</p><Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button></div>
        : loading || !data ? <Skeleton className="h-96 max-w-2xl" /> : (
          <form onSubmit={submit} noValidate aria-label="Portal settings" className="max-w-2xl space-y-8">
            {saved && <p role="status" className="border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">Settings saved.</p>}
            {save.error && Object.keys(save.fieldErrors).length === 0 && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{save.error}</p>}
            {Object.entries(data.meta.groups).map(([group, items]) => (
              <fieldset key={group} className="space-y-4 border bg-white p-5">
                <legend className="px-1 font-serif text-base font-semibold text-primary">{group}</legend>
                {items.map((item) => {
                  const kind = settingKinds[item.key] ?? 'text'
                  const def: FieldDef = {
                    name: item.key, label: item.label, kind, maxLength: 500,
                    options: item.key === 'remember_search_history_default' ? [{ value: 'true', label: 'On' }, { value: 'false', label: 'Off' }] : undefined,
                    required: item.key === 'remember_search_history_default',
                    help: item.key.endsWith('_url') ? 'An https:// address. Leave empty if the system is not configured.' : undefined,
                  }
                  return <AdminField key={item.key} def={def} value={values[item.key] ?? ''} error={save.fieldErrors[item.key]} disabled={save.submitting} onChange={(v) => setValues((p) => ({ ...p, [item.key]: String(v) }))} />
                })}
              </fieldset>
            ))}
            <Button type="submit" disabled={save.submitting}>{save.submitting ? 'Saving…' : 'Save settings'}</Button>
          </form>
        )}
    </>
  )
}

// --- Document categories ---------------------------------------------------------------------------------------------------
export function DocumentCategoriesPage() {
  const { data, error, loading, retry } = useAsync(() => adminApi.get<AdminRecord[]>('/api/admin/document-categories'), [])
  const [form, setForm] = useState({ slug: '', name: '' })
  const create = useMutation((body: typeof form) => adminApi.create('/api/admin/document-categories', body))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (await create.mutate(form)) {
      setForm({ slug: '', name: '' })
      retry()
    }
  }

  return (
    <>
      <AdminPageHeader title="Document categories" description="Categories documents are filed under. Categories are not deleted because documents refer to them." trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Document categories' }]} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {error ? <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-semibold text-destructive">Unable to load categories.</p><Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button></div>
            : loading ? <Skeleton className="h-40" /> : (
              <ul className="divide-y border bg-white">
                {(data ?? []).length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">No categories yet.</li>}
                {(data ?? []).map((c) => <li key={String(c.id)} className="flex items-center justify-between px-3 py-2 text-sm"><span><span className="font-medium">{String(c.name)}</span> <code className="ml-1 text-xs text-muted-foreground">{String(c.slug)}</code></span><span className="text-xs text-muted-foreground">{String(c.documents_count)} documents</span></li>)}
              </ul>
            )}
        </div>
        <form onSubmit={submit} noValidate aria-label="Add category" className="space-y-4 border bg-white p-5">
          {create.error && Object.keys(create.fieldErrors).length === 0 && <p role="alert" className="text-sm text-destructive">{create.error}</p>}
          <AdminField def={{ name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 255 }} value={form.name} error={create.fieldErrors.name} disabled={create.submitting} onChange={(v) => setForm((p) => ({ ...p, name: String(v) }))} />
          <AdminField def={{ name: 'slug', label: 'Identifier', kind: 'text', required: true, maxLength: 60, help: 'Lower-case letters, numbers and hyphens. Cannot be changed later.' }} value={form.slug} error={create.fieldErrors.slug} disabled={create.submitting} onChange={(v) => setForm((p) => ({ ...p, slug: String(v) }))} />
          <Button type="submit" disabled={create.submitting}>{create.submitting ? 'Adding…' : 'Add category'}</Button>
        </form>
      </div>
    </>
  )
}

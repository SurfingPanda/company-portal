import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { ProgressBar } from '@/components/admin/ProgressBar'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { formatDate } from '@/lib/format'
import { adminApi } from '@/services/admin/adminApi'
import { getAdminPolicy, getPolicyReport, remindOutstanding, type ReportParams } from '@/services/policyService'
import type { AdminRecord } from '@/types/admin'
import type { PolicyReportRow } from '@/types/policy'

type Tab = 'pending' | 'acknowledged' | 'all'
const TABS: { value: Tab; label: string }[] = [
  { value: 'pending', label: 'Not read yet' },
  { value: 'acknowledged', label: 'Read' },
  { value: 'all', label: 'Everyone' },
]
const csvCell = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`

/** HR: who has confirmed the current version of a policy, who has not, and a way to chase the rest. */
export default function PolicyReportPage() {
  const { policyId = '' } = useParams()
  const [tab, setTab] = useState<Tab>('pending')
  const [department, setDepartment] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [confirmRemind, setConfirmRemind] = useState(false)
  const [reminded, setReminded] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  const policy = useAsync(() => getAdminPolicy(policyId), [policyId])
  const departments = useAsync(async () => (await adminApi.list<AdminRecord>('/api/admin/hr/departments', { per_page: 100, sort: 'name', direction: 'asc' })).data, [])
  const params = (): ReportParams => ({ status: tab, department_id: department ? Number(department) : undefined, search: search.trim() || undefined })
  const report = useAsync(() => getPolicyReport(policyId, { ...params(), page, per_page: 25 }), [policyId, tab, department, search, page])
  const remind = useMutation(() => remindOutstanding(Number(policyId)))

  const summary = report.data?.summary
  const reset = () => setPage(1)

  const sendReminder = async () => {
    const result = await remind.mutate(undefined)
    setConfirmRemind(false)
    if (result) {
      setReminded(result.notified)
      policy.retry()
    }
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const rows: PolicyReportRow[] = []
      for (let p = 1; p <= 100; p++) {
        const chunk = await getPolicyReport(policyId, { ...params(), page: p, per_page: 100 })
        rows.push(...chunk.data)
        if (p >= chunk.meta.last_page) break
      }
      const lines = [
        ['Employee ID', 'Name', 'Email', 'Job title', 'Department', 'Manager', 'Account', 'Read on'].map(csvCell).join(','),
        ...rows.map((r) => [r.employee_id, r.display_name, r.email, r.job_title, r.department, r.manager, r.account_status === 'pending' ? 'Not signed in yet' : 'Active', r.acknowledged_at ? formatDate(r.acknowledged_at, 'long') : 'Not read'].map(csvCell).join(',')),
      ]
      const url = URL.createObjectURL(new Blob([`﻿${lines.join('\r\n')}\r\n`], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `policy-${policyId}-${tab}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const p = policy.data
  const overdue = Boolean(summary?.due_date && summary.outstanding > 0 && summary.due_date < today)

  return (
    <>
      <AdminPageHeader
        title={p ? p.title : 'Policy'}
        description={p ? `Version ${p.version} · ${p.status}` : undefined}
        trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Policies', href: '/admin/policies' }, { label: 'Who has read it' }]}
        actions={<Button asChild variant="outline" className="bg-white"><Link to={`/admin/policies/${policyId}/edit`}>Edit policy</Link></Button>}
      />

      {summary && (
        <section aria-label="Progress" className="mb-6">
          <ul className="grid gap-3 sm:grid-cols-4">
            <li className="border bg-white p-4"><p className="font-serif text-3xl font-semibold text-primary">{summary.required}</p><p className="text-sm text-muted-foreground">must read it</p></li>
            <li className="border bg-white p-4"><p className="font-serif text-3xl font-semibold text-primary">{summary.acknowledged}</p><p className="text-sm text-muted-foreground">have read it</p></li>
            <li className="border bg-white p-4"><p className={`font-serif text-3xl font-semibold ${summary.outstanding > 0 ? 'text-amber-700' : 'text-primary'}`}>{summary.outstanding}</p><p className="text-sm text-muted-foreground">not yet</p></li>
            <li className="border bg-white p-4"><p className="font-serif text-3xl font-semibold text-primary">{summary.percent}%</p><div className="mt-2"><ProgressBar percent={summary.percent} /></div></li>
          </ul>
          {summary.due_date && (
            <p className={`mt-2 text-sm ${overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
              {overdue ? `Past the due date (${formatDate(summary.due_date, 'long')}).` : `Due ${formatDate(summary.due_date, 'long')}.`}
            </p>
          )}
          {p?.status !== 'published' && <p role="note" className="mt-2 text-sm text-muted-foreground">This policy is {p?.status}: employees cannot see it, and nobody can confirm it.</p>}
        </section>
      )}

      {reminded !== null && <p role="status" className="mb-4 border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">Reminder sent to {reminded} {reminded === 1 ? 'person' : 'people'}.</p>}
      {remind.error && <p role="alert" className="mb-4 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{remind.fieldErrors.remind ?? remind.error}</p>}

      <div role="tablist" aria-label="Show" className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button key={t.value} type="button" role="tab" aria-selected={tab === t.value} onClick={() => { setTab(t.value); reset() }}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring ${tab === t.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="my-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="rep-search" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search</label>
          <Input id="rep-search" value={search} onChange={(e) => { setSearch(e.target.value); reset() }} placeholder="Name, employee ID or email" className="h-9 bg-white" />
        </div>
        <div>
          <label htmlFor="rep-dept" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</label>
          <select id="rep-dept" value={department} onChange={(e) => { setDepartment(e.target.value); reset() }} className="h-9 border border-input bg-white px-2 text-sm">
            <option value="">All</option>
            {departments.data?.map((d) => <option key={String(d.id)} value={String(d.id)}>{String(d.name)}</option>)}
          </select>
        </div>
        <Button type="button" variant="outline" className="bg-white" disabled={exporting || !report.data?.meta.total} onClick={() => void exportCsv()}><Download aria-hidden="true" /> {exporting ? 'Preparing…' : 'Download CSV'}</Button>
        <Button type="button" disabled={!summary || summary.outstanding === 0 || p?.status !== 'published' || remind.submitting} onClick={() => { remind.reset(); setConfirmRemind(true) }}>Remind those who have not read it</Button>
      </div>

      {report.error ? (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-semibold text-destructive">Unable to load the list.</p><Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={report.retry}>Try again</Button></div>
      ) : !report.data && report.loading ? (
        <Skeleton className="h-64" />
      ) : report.data && report.data.data.length === 0 ? (
        <p role="status" className="border border-dashed border-muted-foreground/40 bg-white p-6 text-sm text-muted-foreground">{tab === 'pending' ? 'Everyone has read it.' : 'Nobody to show.'}</p>
      ) : (
        <div className={`overflow-x-auto border bg-white ${report.loading ? 'opacity-60' : ''}`}>
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Employee</th><th className="p-3">Department</th><th className="p-3">Manager</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {report.data?.data.map((r) => (
                <tr key={r.employee_id} className="border-t align-top">
                  <td className="p-3"><span className="font-medium">{r.display_name ?? r.employee_id}</span><span className="block text-xs text-muted-foreground">{r.employee_id} · {r.email}</span>{r.job_title && <span className="block text-xs text-muted-foreground">{r.job_title}</span>}</td>
                  <td className="p-3 text-muted-foreground">{r.department ?? '—'}</td>
                  <td className="p-3 text-muted-foreground">{r.manager ?? '—'}</td>
                  <td className="p-3">
                    {r.acknowledged_at ? <StatusBadge value="completed" label={`Read ${formatDate(r.acknowledged_at, 'short')}`} /> : <StatusBadge value="pending" label="Not read" />}
                    {!r.acknowledged_at && r.account_status === 'pending' && <span className="mt-1 block text-xs text-muted-foreground">Has not signed in yet</span>}
                    {!r.acknowledged_at && r.previously_acknowledged_version && <span className="mt-1 block text-xs text-muted-foreground">Read version {r.previously_acknowledged_version}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report.data && report.data.meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {report.data.meta.current_page} of {report.data.meta.last_page} · {report.data.meta.total} people</span>
          <span className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="bg-white" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>Previous</Button>
            <Button type="button" size="sm" variant="outline" className="bg-white" disabled={page >= report.data.meta.last_page} onClick={() => setPage((n) => n + 1)}>Next</Button>
          </span>
        </div>
      )}

      <ConfirmDialog open={confirmRemind} title="Remind people who have not read it?" reversible={false} confirmLabel="Send reminder" busy={remind.submitting} error={remind.error} onConfirm={() => void sendReminder()} onCancel={() => setConfirmRemind(false)}>
        <p>{summary?.outstanding ?? 0} {summary?.outstanding === 1 ? 'person gets' : 'people get'} a portal notification asking them to read &ldquo;{p?.title}&rdquo;. A reminder can be sent once every 24 hours.</p>
      </ConfirmDialog>
    </>
  )
}

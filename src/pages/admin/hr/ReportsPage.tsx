import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime } from '@/lib/format'
import { API_BASE_URL } from '@/services/api'
import { getReportOverview, type Tally } from '@/services/admin/adminApi'

const heading = 'border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary'
const exportUrl = (type: string) => `${API_BASE_URL}/api/admin/reports/export/${type}`

function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-primary">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Horizontal bars drawn with plain CSS (no chart library): one row per label, with the number beside it. */
function Bars({ rows, empty = 'Nothing to show yet.' }: { rows: Tally[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  if (rows.length === 0) return <p className="py-3 text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="space-y-2 py-3">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(7rem,12rem)_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate" title={r.label}>{r.label}</span>
          <span className="h-3 bg-muted" aria-hidden="true"><span className="block h-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} /></span>
          <span className="text-right font-medium tabular-nums">{r.count}</span>
        </li>
      ))}
    </ul>
  )
}

function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="border bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-base font-semibold text-primary">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

const ExportLink = ({ type, label }: { type: string; label: string }) => (
  <Button asChild variant="outline" size="sm" className="bg-white">
    <a href={exportUrl(type)} download><Download aria-hidden="true" /> {label}</a>
  </Button>
)

/** Headcount, movement, tenure, accounts and policy compliance, with CSV exports. Read-only; built from the portal's own records. */
export default function ReportsPage() {
  const [months, setMonths] = useState(12)
  const { data, error, loading, retry } = useAsync(() => getReportOverview(months), [months])
  const trail = [{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Reports' }]

  const header = (
    <AdminPageHeader
      title="Reports"
      description="A live picture of the company from the records HR keeps in the portal. Exports are CSV files you can open in Excel; each export is written to the activity log."
      trail={trail}
      actions={<div className="flex flex-wrap gap-2"><ExportLink type="directory" label="Export employees" /></div>}
    />
  )

  if (error) return <>{header}<div role="alert" className="border border-destructive/40 bg-destructive/5 p-6 text-sm"><p className="font-semibold text-destructive">Unable to load the reports.</p><Button type="button" variant="outline" size="sm" className="mt-3 bg-white" onClick={retry}>Try again</Button></div></>
  if (loading || !data) return <>{header}<Skeleton className="h-96 w-full" /></>

  const { headcount: h, accounts: a } = data
  const maxMove = Math.max(1, ...data.movement.flatMap((m) => [m.hires, m.leavers]))
  const hires = data.movement.reduce((n, m) => n + m.hires, 0)
  const leavers = data.movement.reduce((n, m) => n + m.leavers, 0)

  return (
    <>
      {header}
      <p className="mb-4 text-xs text-muted-foreground">Updated {formatDateTime(data.generated_at)}</p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Employees on record" value={h.total} hint={`${h.inactive} inactive`} />
        <Kpi label="Active" value={h.active} hint={h.on_leave ? `${h.on_leave} on leave` : undefined} />
        <Kpi label={`Hired, last ${months} months`} value={hires} />
        <Kpi label={`Left, last ${months} months`} value={leavers} hint="Counted when set to inactive" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="dept-h">
          <h2 id="dept-h" className={heading}>Headcount</h2>
          <div className="mt-3 space-y-4">
            <Card title="By department" action={<ExportLink type="headcount" label="Export" />}><Bars rows={h.by_department} empty="No employee records yet." /></Card>
            <Card title="By location"><Bars rows={h.by_location} /></Card>
            <Card title="By employment type"><Bars rows={h.by_type} /></Card>
            <Card title="How long people have been here"><Bars rows={data.tenure} /></Card>
          </div>
        </section>

        <section aria-labelledby="move-h">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-primary pb-2">
            <h2 id="move-h" className="font-serif text-lg font-semibold text-primary">Hires and leavers</h2>
            <div>
              <label htmlFor="months" className="sr-only">Period</label>
              <select id="months" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="h-8 border border-input bg-white px-2 text-sm">
                {[6, 12, 24].map((m) => <option key={m} value={m}>Last {m} months</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 border bg-white p-4">
            <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 bg-primary" aria-hidden="true" /> Hired</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 bg-amber-500" aria-hidden="true" /> Left</span>
            </div>
            <ul className="space-y-1.5">
              {data.movement.map((m) => (
                <li key={m.month} className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="space-y-0.5" aria-hidden="true">
                    <span className="block h-2 bg-primary" style={{ width: `${(m.hires / maxMove) * 100}%`, minWidth: m.hires ? 2 : 0 }} />
                    <span className="block h-2 bg-amber-500" style={{ width: `${(m.leavers / maxMove) * 100}%`, minWidth: m.leavers ? 2 : 0 }} />
                  </span>
                  <span className="text-right tabular-nums">{m.hires} / {m.leavers}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Hires use the date joined on the employee record. Leavers are counted when HR sets someone to inactive.</p>
          </div>

          <h2 className={`${heading} mt-8`}>Portal accounts</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Kpi label="Signed up and active" value={a.active} />
            <Kpi label="Waiting for first sign-in" value={a.waiting_first_sign_in} hint="Have not set a password yet" />
            <Kpi label="Disabled" value={a.disabled} />
            <Kpi label="Login without employee record" value={a.without_record} hint="Should be 0" />
          </div>
        </section>
      </div>

      <section aria-labelledby="pol-h" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-primary pb-2">
          <h2 id="pol-h" className="font-serif text-lg font-semibold text-primary">Policy acknowledgements</h2>
          <ExportLink type="policies" label="Export" />
        </div>
        {data.policies.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No published policies yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto border bg-white">
            <table className="w-full text-sm">
              <caption className="sr-only">Policy acknowledgement progress</caption>
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider"><tr><th scope="col" className="p-3">Policy</th><th scope="col" className="p-3">Version</th><th scope="col" className="p-3">Progress</th><th scope="col" className="p-3 text-right">Done</th><th scope="col" className="p-3 text-right">Outstanding</th></tr></thead>
              <tbody>
                {data.policies.map((p) => (
                  <tr key={p.id} className="border-t">
                    <th scope="row" className="p-3 text-left font-medium"><Link to={`/admin/policies/${p.id}/report`} className="text-primary underline-offset-2 hover:underline">{p.title}</Link></th>
                    <td className="p-3">v{p.version}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2"><span className="h-2.5 w-40 bg-muted" aria-hidden="true"><span className="block h-full bg-emerald-600" style={{ width: `${p.percent}%` }} /></span><span className="text-xs tabular-nums">{p.percent}%</span></div>
                    </td>
                    <td className="p-3 text-right tabular-nums">{p.acknowledged} of {p.required}</td>
                    <td className="p-3 text-right tabular-nums">{p.outstanding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

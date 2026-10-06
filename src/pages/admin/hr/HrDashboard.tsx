import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthorization } from '@/auth/useAuthorization'
import type { Permission } from '@/auth/permissions'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { adminApi } from '@/services/admin/adminApi'

interface BulkResult {
  created: number
  linked: number
  skipped: { employee_id: string; display_name: string; reason: string }[]
  more_remaining: boolean
}

interface HrDashboardData {
  directory: { total: number; visible: number; hidden: number; unlinked: number }
  departments: { total: number; published: number }
  locations: { total: number; published: number }
  company: { overview_published: boolean; history_published: number; leadership_published: number; drafts: number }
}

const actions: { label: string; href: string; permissions: Permission[] }[] = [
  { label: 'Add directory entry', href: '/admin/hr/employees/create', permissions: ['hr.directory.manage'] },
  { label: 'Import employees (CSV)', href: '/admin/hr/employees/import', permissions: ['hr.directory.manage'] },
  { label: 'Manage departments', href: '/admin/hr/departments', permissions: ['hr.departments.manage'] },
  { label: 'Edit company information', href: '/admin/hr/company', permissions: ['hr.company.manage'] },
  { label: 'Manage locations', href: '/admin/hr/company/locations', permissions: ['hr.company.manage'] },
  { label: 'Manage HR documents', href: '/admin/documents', permissions: ['documents.manage', 'documents.hr-manage'] },
  { label: 'Manage HR forms', href: '/admin/forms', permissions: ['forms.manage'] },
]

/** HR content dashboard. Every figure is a live count; nothing is estimated. */
export default function HrDashboard() {
  const { data, error, loading, retry } = useAsync(() => adminApi.get<HrDashboardData>('/api/admin/hr/dashboard'), [])
  const { hasAnyPermission, hasPermission } = useAuthorization()
  const [confirmLogins, setConfirmLogins] = useState(false)
  const bulk = useMutation(() => adminApi.create<BulkResult>('/api/admin/hr/employees/create-logins', {}))
  const [result, setResult] = useState<BulkResult | null>(null)
  const runBulk = async () => {
    const done = await bulk.mutate(undefined)
    if (done) {
      setResult(done)
      setConfirmLogins(false)
      retry()
    }
  }

  const stats = data
    ? [
        { label: 'Directory entries', value: data.directory.total, href: '/admin/hr/employees' },
        { label: 'Visible to employees', value: data.directory.visible, href: '/admin/hr/employees?visibility=visible' },
        { label: 'Hidden from the directory', value: data.directory.hidden, href: '/admin/hr/employees?visibility=hidden' },
        { label: 'Entries without a portal account', value: data.directory.unlinked, href: '/admin/hr/employees?account=unlinked' },
        { label: 'Departments published', value: data.departments.published, href: '/admin/hr/departments' },
        { label: 'Locations published', value: data.locations.published, href: '/admin/hr/company/locations' },
        { label: 'Drafts awaiting publication', value: data.company.drafts, href: '/admin/hr/company/history?status=draft' },
      ]
    : []

  return (
    <>
      <AdminPageHeader title="HR Management" description="Employee records, the employee-facing directory and company content. HR enters everything here." trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'HR Management' }]} />

      {error ? (
        <div role="alert" className="mb-8 border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Unable to load the HR figures.</p>
          <Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button>
        </div>
      ) : loading ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading figures">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <>
          <ul className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((st) => (
              <li key={st.label} className="border bg-white">
                <Link to={st.href} className="block p-4 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring">
                  <p className="font-serif text-3xl font-semibold text-primary">{st.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{st.label}</p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mb-8 text-sm text-muted-foreground">
            Company overview: <strong>{data?.company.overview_published ? 'published' : 'not published'}</strong> · history entries published: {data?.company.history_published} · leadership profiles published: {data?.company.leadership_published}
          </p>
          {data && data.directory.total === 0 && data.departments.total === 0 && <p role="status" className="mb-8 border border-dashed border-muted-foreground/40 bg-white p-4 text-sm text-muted-foreground">Nothing has been configured yet. Start by adding departments and locations, then directory entries.</p>}
        </>
      )}

      {hasPermission('hr.directory.manage') && ((data?.directory.unlinked ?? 0) > 0 || result) && (
        <section aria-labelledby="hr-logins" className="mb-8 border bg-white p-4">
          <h2 id="hr-logins" className="font-serif text-lg font-semibold text-primary">Employee logins</h2>
          {(data?.directory.unlinked ?? 0) > 0 && (
            <>
              <p className="mt-2 text-sm text-foreground/85">{data?.directory.unlinked} employee record(s) have no login yet. Create them in one step: each employee gets a login with their company email and an email with a link to choose their own password.</p>
              <Button type="button" className="mt-3" onClick={() => setConfirmLogins(true)}>Create logins for all</Button>
            </>
          )}
          {result && (
            <div role="status" className="mt-3 text-sm">
              <p><strong>{result.created}</strong> login(s) created{result.linked > 0 && <>, <strong>{result.linked}</strong> linked to an existing account</>}.{result.more_remaining && ' More records remain: run it again.'}</p>
              {result.skipped.length > 0 && (
                <>
                  <p className="mt-2 font-medium text-destructive">{result.skipped.length} skipped:</p>
                  <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                    {result.skipped.map((r) => <li key={r.employee_id}><Link to={`/admin/hr/employees?search=${encodeURIComponent(r.employee_id)}`} className="text-primary underline-offset-2 hover:underline">{r.employee_id} {r.display_name}</Link>: {r.reason}</li>)}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>
      )}
      <ConfirmDialog open={confirmLogins} title="Create logins for all employees without one?" reversible={false} confirmLabel="Create logins" busy={bulk.submitting} error={bulk.error} onConfirm={runBulk} onCancel={() => setConfirmLogins(false)}>
        <p>{data?.directory.unlinked ?? 0} employee record(s) will get a pending login and an email with a link to choose a password (up to 100 per run). Records without a company email are skipped and listed. Accounts can be disabled later under Users.</p>
      </ConfirmDialog>

      <section aria-labelledby="hr-quick">
        <h2 id="hr-quick" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.filter((a) => hasAnyPermission(a.permissions)).map((a) => <Button key={a.href} asChild variant="outline" className="bg-white"><Link to={a.href}>{a.label}</Link></Button>)}
        </div>
      </section>
    </>
  )
}

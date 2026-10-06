import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { EmployeePersonalPanel } from '@/components/admin/EmployeePersonalPanel'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthorization } from '@/auth/useAuthorization'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/format'
import { useMutation } from '@/hooks/useMutation'
import { adminApi } from '@/services/admin/adminApi'
import type { AdminRecord } from '@/types/admin'

const s = (r: AdminRecord, k: string) => String(r[k] ?? '')
const heading = 'border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary'

function Detail({ initial }: { initial: AdminRecord }) {
  const [entry, setEntry] = useState(initial)
  const { hasPermission } = useAuthorization()
  const [confirm, setConfirm] = useState(false)
  const account = (entry.account ?? { linked: false, status: null }) as { linked: boolean; status: string | null }
  const preview = (entry.preview ?? {}) as AdminRecord
  const visible = entry.is_visible === true

  const toggle = useMutation((is_visible: boolean) => adminApi.patch<AdminRecord>(`/api/admin/hr/employees/${entry.id}/visibility`, { is_visible }))
  const link = useMutation(() => adminApi.create<AdminRecord>(`/api/admin/hr/employees/${entry.id}/link-account`, {}))

  const setVisible = async (value: boolean) => {
    const updated = await toggle.mutate(value)
    if (updated) {
      setEntry(updated)
      setConfirm(false)
    }
  }
  const linkAccount = async () => {
    const updated = await link.mutate(undefined)
    if (updated) setEntry(updated)
  }

  const official: [string, string, boolean][] = [
    ['Employee ID', s(entry, 'employee_id'), true],
    ['Job title', s(entry, 'job_title') || '—', true],
    ['Department', s(entry, 'department') || '—', true],
    ['Company email', s(entry, 'company_email') || '—', true],
    ['Employment status', s(entry, 'employment_status').replace(/_/g, ' ') || '—', true],
    ['Employment type', s(entry, 'employment_type').replace(/_/g, ' ') || '—', true],
    ['Date joined', s(entry, 'date_joined') ? formatDate(s(entry, 'date_joined'), 'long') : '—', true],
    ['Manager', s(entry, 'manager') || '—', true],
  ]

  return (
    <>
      <AdminPageHeader
        title={s(entry, 'display_name')}
        description={s(entry, 'employee_id')}
        trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Employee Directory', href: '/admin/hr/employees' }, { label: s(entry, 'employee_id') }]}
        actions={hasPermission('hr.directory.manage') ? <Button asChild><Link to={`/admin/hr/employees/${entry.id}/edit`}>Edit entry</Link></Button> : undefined}
      />
      {(toggle.error || link.error) && <p role="alert" className="mb-4 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{toggle.error ?? link.fieldErrors.employee_id ?? link.error}</p>}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section aria-labelledby="official-h">
            <h2 id="official-h" className={heading}>Employment details</h2>
            <dl className="mt-2">
              {official.map(([k, v]) => <div key={k} className="grid grid-cols-[10rem_1fr] gap-3 border-b py-2.5 text-sm"><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              These details were entered by HR. Use Edit entry to correct them.
            </p>
          </section>

          {hasPermission('hr.directory.manage') && <EmployeePersonalPanel entryId={Number(entry.id)} hasAccount={account.linked} name={s(entry, 'display_name')} />}

          <section aria-labelledby="preview-h">
            <h2 id="preview-h" className={heading}>What employees see</h2>
            {visible ? (
              <dl className="mt-2 border bg-white p-4 text-sm">
                <dt className="sr-only">Name</dt><dd className="font-serif text-lg font-semibold text-primary">{s(preview, 'display_name')}</dd>
                <dt className="sr-only">Job title</dt><dd className="text-muted-foreground">{s(preview, 'job_title') || 'No job title'}</dd>
                <dd className="mt-2">{[s(preview, 'department'), s(preview, 'location')].filter(Boolean).join(' · ') || 'No department or location'}</dd>
                <dd>{s(preview, 'company_email')} {s(preview, 'phone')}</dd>
                {s(preview, 'description') && <dd className="mt-2 whitespace-pre-line">{s(preview, 'description')}</dd>}
              </dl>
            ) : <p className="mt-2 border border-dashed border-muted-foreground/40 bg-white p-4 text-sm text-muted-foreground">This entry is hidden: employees do not see it anywhere in the directory or in search.</p>}
          </section>
        </div>

        <aside className="space-y-8">
          <section aria-labelledby="vis-h">
            <h2 id="vis-h" className={heading}>Directory visibility</h2>
            <p className="mt-3 text-sm"><StatusBadge value={visible ? 'active' : 'inactive'} label={visible ? 'Visible to employees' : 'Hidden'} /></p>
            <p className="mt-2 text-xs text-muted-foreground">Visibility never changes the portal account or its access.</p>
            {hasPermission('hr.directory.visibility') && (
              <Button type="button" variant="outline" className="mt-3 w-full bg-white" disabled={toggle.submitting} onClick={() => (visible ? setConfirm(true) : void setVisible(true))}>
                {visible ? 'Hide from directory' : 'Show in directory'}
              </Button>
            )}
          </section>

          <section aria-labelledby="acct-h">
            <h2 id="acct-h" className={heading}>Portal account</h2>
            {account.linked ? (
              <p className="mt-3 text-sm">Login: <StatusBadge value={account.status ?? 'inactive'} />{account.status === 'pending' && <span className="ml-2 text-xs text-muted-foreground">Waiting for the employee to choose a password.</span>}{entry.login_disabled_by_hr === true && <span className="mt-1 block text-xs text-muted-foreground">Disabled automatically because this employee is Inactive. Set them to Active (Edit entry) to restore it.</span>}</p>
            ) : (
              <>
                <p className="mt-3 text-sm">This employee has no login yet.</p>
                {hasPermission('hr.directory.manage') && <Button type="button" variant="outline" className="mt-3 w-full bg-white" disabled={link.submitting} onClick={linkAccount}>{link.submitting ? 'Creating…' : 'Create login & send password link'}</Button>}
                <p className="mt-2 text-xs text-muted-foreground">Creates a login using the company email and emails the employee a link to choose their own password. Roles are managed under Users.</p>
              </>
            )}
          </section>
        </aside>
      </div>

      <ConfirmDialog open={confirm} title="Hide from the directory?" reversible confirmLabel="Hide entry" busy={toggle.submitting} error={toggle.error} onCancel={() => setConfirm(false)} onConfirm={() => void setVisible(false)}>
        <p><strong>{s(entry, 'display_name')}</strong> will disappear from the Employee Directory and search. Their portal account and access are not affected.</p>
      </ConfirmDialog>
    </>
  )
}

export default function EmployeeDirectoryDetailPage() {
  const { id = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => adminApi.get<AdminRecord>(`/api/admin/hr/employees/${id}`), [id])
  if (error) return <div role="alert" className="border border-destructive/40 bg-destructive/5 p-6 text-sm"><p className="font-semibold text-destructive">Unable to load this entry.</p><p className="mt-1 text-muted-foreground">{error.message}</p><Button type="button" variant="outline" size="sm" className="mt-3 bg-white" onClick={retry}>Try again</Button></div>
  if (loading || !data) return <Skeleton className="h-96 max-w-4xl" />
  return <Detail initial={data} />
}

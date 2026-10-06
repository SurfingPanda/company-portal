import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { formatDateTime } from '@/lib/format'
import { addUserRole, getUser, removeUserRole, sendUserPasswordLink, setUserStatus } from '@/services/admin/adminApi'
import type { AccountStatus, AdminUser } from '@/types/admin'
import { roleLabel } from '@/auth/roles'
import { roleOptions, statusOptions } from '@/pages/admin/users/UsersListPage'

const heading = 'border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary'
const STATUS_MEANING: Record<AccountStatus, string> = {
  active: 'Can sign in and use the portal.',
  inactive: 'No portal access.',
  suspended: 'Access temporarily blocked.',
  pending: 'Waiting for the person to choose a password from the activation email; cannot sign in yet.',
}

type Pending = { kind: 'status'; status: AccountStatus } | { kind: 'remove-role'; role: string }

function UserDetail({ initial }: { initial: AdminUser }) {
  const [user, setUser] = useState(initial)
  const { user: me } = useAuth()
  const isSelf = me?.employeeId === user.employee_id
  const [pending, setPending] = useState<Pending | null>(null)
  const [newRole, setNewRole] = useState('')
  const [status, setStatus] = useState<AccountStatus>(user.status)

  const change = useMutation(async (what: { kind: 'status'; status: AccountStatus } | { kind: 'add-role'; role: string } | { kind: 'remove-role'; role: string }) => {
    if (what.kind === 'status') return setUserStatus(user.id, what.status)
    if (what.kind === 'add-role') return addUserRole(user.id, what.role)
    return removeUserRole(user.id, what.role)
  })

  const apply = async (what: Parameters<typeof change.mutate>[0]) => {
    const updated = await change.mutate(what)
    if (updated) {
      // The list endpoint omits permissions and activity; reload the detail so the access summary stays accurate.
      setUser(await getUser(user.id))
      setStatus(updated.status)
      setPending(null)
      setNewRole('')
    }
  }

  const [emailed, setEmailed] = useState<string>()
  const mail = useMutation((_: void) => sendUserPasswordLink(user.id))
  const canEmail = user.status === 'pending' || user.status === 'active'
  const sendLink = async () => {
    setEmailed(undefined)
    const result = await mail.mutate()
    if (result) setEmailed(result.message)
  }

  const available = roleOptions.filter((r) => !user.roles.includes(r.value as AdminUser['roles'][number]))
  const message = change.error ?? Object.values(change.fieldErrors)[0]

  return (
    <>
      <AdminPageHeader
        title={user.employee_id}
        description={user.display_name}
        trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Users', href: '/admin/users' }, { label: user.employee_id }]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canEmail && <Button type="button" variant="outline" className="bg-white" disabled={mail.submitting} onClick={sendLink}>{mail.submitting ? 'Sending…' : user.status === 'pending' ? 'Send activation email' : 'Send password reset email'}</Button>}
            <Button asChild variant="outline" className="bg-white"><Link to={`/admin/access/${user.id}`}>Edit access</Link></Button>
            <Button asChild variant="outline" className="bg-white"><Link to={`/admin/users/${user.id}/edit`}>Edit email</Link></Button>
          </div>
        }
      />
      {emailed && <p role="status" className="mb-4 border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">{emailed}</p>}
      {mail.error && <p role="alert" className="mb-4 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{mail.error}</p>}
      {message && <p role="alert" className="mb-4 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{message}</p>}
      {isSelf && <p role="note" className="mb-4 border border-dashed border-muted-foreground/40 p-3 text-sm text-muted-foreground">This is your own account. You cannot change your own roles or status; ask another administrator.</p>}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section aria-labelledby="account-h">
            <h2 id="account-h" className={heading}>Account information</h2>
            <dl className="mt-1">
              {[
                ['Employee ID', <span key="e" className="font-mono">{user.employee_id}</span>],
                ['Company email', user.email],
                ['Account status', <span key="s" className="inline-flex flex-wrap items-center gap-2"><StatusBadge value={user.status} /> <span className="text-xs text-muted-foreground">{STATUS_MEANING[user.status]}</span></span>],
                ['Created', user.created_at ? formatDateTime(user.created_at) : '—'],
                ['Last login', user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'],
                ['Updated', user.updated_at ? formatDateTime(user.updated_at) : '—'],
              ].map(([k, v]) => (
                <div key={String(k)} className="grid grid-cols-[10rem_1fr] gap-3 border-b py-2.5 text-sm">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">Name, department, job title, manager and employment status are kept on the employee record in HR Management and are not edited here.</p>
          </section>

          <section aria-labelledby="access-h">
            <h2 id="access-h" className={heading}>Portal access</h2>
            <p className="mt-3 text-sm text-muted-foreground">Roles</p>
            <ul className="mt-1 divide-y border bg-white">
              {user.roles.map((role) => (
                <li key={role} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="font-medium">{roleLabel(role)}</span>
                  <Button type="button" variant="outline" size="sm" className="bg-white" disabled={isSelf || change.submitting} onClick={() => { change.reset(); setPending({ kind: 'remove-role', role }) }} aria-label={`Remove role ${role}`}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            {available.length > 0 && !isSelf && (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div>
                  <label htmlFor="add-role" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assign role</label>
                  <select id="add-role" value={newRole} onChange={(e) => setNewRole(e.target.value)} className="h-9 border border-input bg-white px-2 text-sm">
                    <option value="">Choose a role…</option>
                    {available.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <Button type="button" size="sm" disabled={!newRole || change.submitting} onClick={() => apply({ kind: 'add-role', role: newRole })}>Assign role</Button>
              </div>
            )}
            {user.permissions && (
              <details className="mt-4 border bg-white p-3 text-sm">
                <summary className="cursor-pointer font-medium">Permissions granted by these roles ({user.permissions.length})</summary>
                <p className="mt-2 break-words font-mono text-xs leading-relaxed text-muted-foreground">{[...user.permissions].sort().join('  ·  ')}</p>
              </details>
            )}
          </section>

          <section aria-labelledby="activity-h">
            <h2 id="activity-h" className={heading}>Activity</h2>
            {(user.activity ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No sign-in or account activity recorded yet.</p>
            ) : (
              <ul className="mt-2 divide-y border bg-white">
                {user.activity!.map((a, i) => (
                  <li key={`${a.at}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
                    <span><span className="font-medium">{a.action.replace(/_/g, ' ')}</span> <span className="text-xs text-muted-foreground">{a.source === 'admin' ? '(administration)' : ''}</span></span>
                    <time dateTime={a.at} className="text-xs text-muted-foreground">{formatDateTime(a.at)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside aria-labelledby="status-h" className="space-y-3">
          <h2 id="status-h" className={heading}>Account status</h2>
          <label htmlFor="status-select" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Change status</label>
          <select id="status-select" value={status} disabled={isSelf || change.submitting} onChange={(e) => setStatus(e.target.value as AccountStatus)} className="h-9 w-full border border-input bg-white px-2 text-sm">
            {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">{STATUS_MEANING[status]}</p>
          <Button
            type="button"
            className="w-full"
            disabled={isSelf || status === user.status || change.submitting}
            onClick={() => { change.reset(); if (status === 'active') void apply({ kind: 'status', status }); else setPending({ kind: 'status', status }) }}
          >
            Apply status
          </Button>
        </aside>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.kind === 'status' ? `Set ${user.employee_id} to ${pending.status}?` : `Remove the ${pending?.kind === 'remove-role' ? roleLabel(pending.role) : ''} role?`}
        reversible
        confirmLabel={pending?.kind === 'status' ? 'Change status' : 'Remove role'}
        busy={change.submitting}
        error={message}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void apply(pending.kind === 'status' ? { kind: 'status', status: pending.status } : { kind: 'remove-role', role: pending.role })}
      >
        {pending?.kind === 'status' ? (
          <p><strong>{user.employee_id}</strong> ({user.email}) will lose portal access immediately and any signed-in session ends. {STATUS_MEANING[pending.status]} You can restore access by setting the status back to Active.</p>
        ) : (
          <p><strong>{user.employee_id}</strong> will lose the permissions that come only from this role. You can assign it again later.</p>
        )}
      </ConfirmDialog>
    </>
  )
}

export default function UserDetailPage() {
  const { userId = '' } = useParams()
  const location = useLocation()
  const { data, error, loading, retry } = useAsync(() => getUser(userId), [userId])

  if (error) return <div role="alert" className="border border-destructive/40 bg-destructive/5 p-6 text-sm"><p className="font-semibold text-destructive">Unable to load this user.</p><p className="mt-1 text-muted-foreground">{error.message}</p><Button type="button" variant="outline" size="sm" className="mt-3 bg-white" onClick={retry}>Try again</Button></div>
  if (loading || !data) return <Skeleton className="h-96 max-w-4xl" />
  return (
    <>
      {(location.state as { created?: boolean } | null)?.created && <p role="status" className="mb-4 border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">User created. The account has no usable password yet: an operator sets it with <code>php artisan portal:set-password</code> until an activation flow exists.</p>}
      <UserDetail initial={data} />
    </>
  )
}

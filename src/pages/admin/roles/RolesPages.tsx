import { Link, useParams } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getPermissionGroups, getRoles } from '@/services/admin/adminApi'

const ErrorBox = ({ retry }: { retry: () => void }) => (
  <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
    <p className="font-semibold text-destructive">Unable to load this page.</p>
    <Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button>
  </div>
)

const ROLE_NOTE = 'Roles are defined in the application so permissions cannot be widened by accident. To change what a role can do, change the code and deploy; to change who has a role, use Users.'

export function RolesListPage() {
  const { data, error, loading, retry } = useAsync(getRoles, [])
  return (
    <>
      <AdminPageHeader title="Roles" description={ROLE_NOTE} trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Roles' }]} />
      {error ? <ErrorBox retry={retry} /> : loading ? <Skeleton className="h-64" /> : (
        <div className="overflow-x-auto border bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">Roles</caption>
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider"><tr><th scope="col" className="p-3">Role</th><th scope="col" className="p-3">Description</th><th scope="col" className="p-3 text-right">Users</th><th scope="col" className="p-3 text-right">Permissions</th></tr></thead>
            <tbody>
              {(data ?? []).map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <th scope="row" className="p-3 text-left font-medium"><Link to={`/admin/roles/${r.id}`} className="text-primary underline-offset-2 hover:underline">{r.label}</Link></th>
                  <td className="max-w-xl p-3 text-muted-foreground">{r.description}</td>
                  <td className="p-3 text-right">{r.users_count}</td>
                  <td className="p-3 text-right">{r.permissions.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export function RoleDetailPage() {
  const { roleId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(getRoles, [])
  const role = data?.find((r) => String(r.id) === roleId)
  return (
    <>
      <AdminPageHeader title={role?.label ?? 'Role'} description={role?.description} trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Roles', href: '/admin/roles' }, { label: role?.label ?? '…' }]} />
      {error ? <ErrorBox retry={retry} /> : loading ? <Skeleton className="h-64" /> : !role ? <p role="status" className="text-sm text-muted-foreground">Role not found.</p> : (
        <>
          <p className="mb-4 text-sm"><strong>{role.users_count}</strong> {role.users_count === 1 ? 'user has' : 'users have'} this role. <Link to={`/admin/users?role=${role.name}`} className="text-primary underline-offset-2 hover:underline">View them</Link></p>
          <h2 className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Permissions ({role.permissions.length})</h2>
          <ul className="mt-3 grid gap-x-6 gap-y-1 font-mono text-xs sm:grid-cols-2 xl:grid-cols-3">
            {[...role.permissions].sort().map((p) => <li key={p} className="border-b py-1">{p}</li>)}
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">{ROLE_NOTE}</p>
        </>
      )}
    </>
  )
}

export function PermissionsPage() {
  const { data, error, loading, retry } = useAsync(getPermissionGroups, [])
  return (
    <>
      <AdminPageHeader title="Permissions" description="Every permission, grouped by module, and the roles that hold it. Permissions are defined centrally; none can be created here." trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Permissions' }]} />
      {error ? <ErrorBox retry={retry} /> : loading ? <Skeleton className="h-64" /> : (
        <div className="space-y-6">
          {(data ?? []).map((group) => (
            <section key={group.module} aria-labelledby={`perm-${group.module}`}>
              <h2 id={`perm-${group.module}`} className="border-b-2 border-primary pb-1.5 font-serif text-base font-semibold text-primary">{group.label}</h2>
              <ul className="divide-y border bg-white">
                {group.permissions.map((p) => (
                  <li key={p.name} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <code className="text-xs">{p.name}</code>
                    <span className="text-xs text-muted-foreground">{p.roles.length ? p.roles.join(', ') : 'No role'}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

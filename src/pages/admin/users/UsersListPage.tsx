import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AdminFilters } from '@/components/admin/AdminFilters'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { useAdminList } from '@/hooks/useAdminList'
import { formatDateTime } from '@/lib/format'
import { roleChoices, roleLabel } from '@/auth/roles'
import { getUsers } from '@/services/admin/adminApi'
import type { AdminUser } from '@/types/admin'

export const statusOptions = ['active', 'inactive', 'suspended', 'pending'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))
export const roleOptions = roleChoices.map(({ value, label }) => ({ value, label }))

/**
 * Portal accounts. Name and department live on the employee record, not the account, so the list shows the portal display
 * name only.
 */
export default function UsersListPage() {
  const list = useAdminList<AdminUser>(getUsers, ['status', 'role'], { sort: 'created_at', direction: 'desc' })

  const columns: AdminColumn<AdminUser>[] = [
    { key: 'employee_id', header: 'Employee ID', sortKey: 'employee_id', render: (u) => <Link to={`/admin/users/${u.id}`} className="font-mono text-primary underline-offset-2 hover:underline">{u.employee_id}</Link> },
    { key: 'name', header: 'Name', render: (u) => <span className="font-medium">{u.display_name}</span> },
    { key: 'email', header: 'Company email', sortKey: 'email', render: (u) => u.email },
    { key: 'roles', header: 'Role', render: (u) => u.roles.map(roleLabel).join(', ') },
    { key: 'status', header: 'Status', sortKey: 'status', render: (u) => <StatusBadge value={u.status} /> },
    { key: 'last_login_at', header: 'Last login', sortKey: 'last_login_at', render: (u) => (u.last_login_at ? formatDateTime(u.last_login_at) : 'Never') },
    { key: 'created_at', header: 'Created', sortKey: 'created_at', render: (u) => (u.created_at ? formatDateTime(u.created_at) : '—') },
    { key: 'actions', header: 'Actions', className: 'text-right', render: (u) => <Button asChild variant="outline" size="sm" className="bg-white"><Link to={`/admin/users/${u.id}`} aria-label={`View ${u.employee_id}`}>View</Link></Button> },
  ]

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Portal accounts linked to employee IDs. Names, departments and job titles are kept on the employee record in HR Management."
        trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Users' }]}
        actions={<Button asChild><Link to="/admin/users/create"><Plus aria-hidden="true" /> Create user</Link></Button>}
      />
      <AdminFilters
        search={list.search}
        searchLabel="Search employee ID or email"
        filters={[{ key: 'status', label: 'Status', options: statusOptions }, { key: 'role', label: 'Role', options: roleOptions }]}
        values={list.params}
        onChange={list.update}
      />
      <AdminTable
        caption="Portal users"
        columns={columns}
        page={list.data}
        loading={list.loading}
        error={list.error}
        onRetry={list.retry}
        rowKey={(u) => u.id}
        sort={String(list.params.sort ?? '')}
        direction={list.params.direction as 'asc' | 'desc' | undefined}
        onSort={(key) => list.update({ sort: key, direction: list.params.sort === key && list.params.direction === 'asc' ? 'desc' : 'asc' })}
        onPage={(page) => list.update({ page: String(page) })}
        emptyTitle="No users found"
        emptyHint="Create the first portal account, or change the search and filters."
      />
    </>
  )
}

import { Link } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthorization } from '@/auth/useAuthorization'
import type { Permission } from '@/auth/permissions'
import { useAsync } from '@/hooks/useAsync'
import { getAdminDashboard } from '@/services/admin/adminApi'

interface Stat { label: string; value: number; href: string }

const actions: { label: string; href: string; permissions: Permission[] }[] = [
  { label: 'Create user', href: '/admin/users/create', permissions: ['users.manage'] },
  { label: 'Create announcement', href: '/admin/announcements/create', permissions: ['announcements.manage', 'announcements.hr-manage'] },
  { label: 'Add document', href: '/admin/documents/create', permissions: ['documents.manage', 'documents.hr-manage', 'documents.it-manage'] },
  { label: 'Create event', href: '/admin/calendar/create', permissions: ['calendar.manage'] },
  { label: 'Create form', href: '/admin/forms/create', permissions: ['forms.manage'] },
  { label: 'Review requests', href: '/admin/requests', permissions: ['requests.manage', 'requests.hr-review', 'requests.team-review', 'requests.it-review'] },
  { label: 'Review helpdesk tickets', href: '/admin/helpdesk/tickets', permissions: ['helpdesk.manage'] },
]

/** Operational overview. Every number is a real count from Laravel; only the groups the person manages are returned. */
export default function AdminDashboard() {
  const { data, error, loading, retry } = useAsync(getAdminDashboard, [])
  const { hasAnyPermission } = useAuthorization()

  const stats: Stat[] = data
    ? [
        ...(data.users ? [{ label: 'Portal users', value: data.users.total, href: '/admin/users' }, { label: 'Active users', value: data.users.active, href: '/admin/users?status=active' }, { label: 'Pending accounts', value: data.users.pending, href: '/admin/users?status=pending' }] : []),
        ...(data.requests ? [{ label: 'Requests awaiting review', value: data.requests.pending, href: '/admin/requests' }] : []),
        ...(data.helpdesk ? [{ label: 'Open helpdesk tickets', value: data.helpdesk.open, href: '/admin/helpdesk/tickets' }] : []),
        ...(data.announcements ? [{ label: 'Draft announcements', value: data.announcements.drafts, href: '/admin/announcements?status=draft' }] : []),
        ...(data.events ? [{ label: 'Upcoming events', value: data.events.upcoming, href: '/admin/calendar' }] : []),
        ...(data.documents ? [{ label: 'Published documents', value: data.documents.published, href: '/admin/documents?status=published' }] : []),
        ...(data.recruitment ? [{ label: 'Applications to review', value: data.recruitment.open_applications, href: '/admin/recruitment/applications' }] : []),
      ]
    : []

  return (
    <>
      <AdminPageHeader title="Dashboard" description="What needs attention across the portal. Figures are live counts, never estimates." trail={[{ label: 'Administration' }, { label: 'Dashboard' }]} />

      {error ? (
        <div role="alert" className="mb-8 border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Unable to load the dashboard figures.</p>
          <Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button>
        </div>
      ) : loading ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading figures">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : stats.length === 0 ? (
        <p role="status" className="mb-8 border border-dashed border-muted-foreground/40 bg-white p-4 text-sm text-muted-foreground">No figures are available for your role.</p>
      ) : (
        <ul className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <li key={s.label} className="border bg-white">
              <Link to={s.href} className="block p-4 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring">
                <p className="font-serif text-3xl font-semibold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="quick-h">
        <h2 id="quick-h" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.filter((a) => hasAnyPermission(a.permissions)).map((a) => (
            <Button key={a.href} asChild variant="outline" className="bg-white"><Link to={a.href}>{a.label}</Link></Button>
          ))}
        </div>
      </section>
    </>
  )
}

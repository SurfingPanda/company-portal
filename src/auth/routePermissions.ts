import { ADMIN_AREA_PERMISSIONS, type Permission } from '@/auth/permissions'

/**
 * Central route authorization. Each entry protects a path and everything beneath it; the most specific entry wins.
 * Routes that are not listed (e.g. /unauthorized and unknown paths) need sign-in only.
 * This keeps authorization out of individual pages. It is a UI convenience: the backend must reject unauthorized
 * requests itself, because hiding or blocking a page in React protects nothing.
 */
const routePermissions: { path: string; permission: Permission | readonly Permission[] }[] = [
  { path: '/', permission: 'portal.view' },
  { path: '/company', permission: 'portal.view' },
  { path: '/directory', permission: 'directory.view' },
  { path: '/policies', permission: 'policies.view' },
  { path: '/admin/policies', permission: 'policies.manage' },
  { path: '/documents', permission: 'documents.view' },
  { path: '/calendar', permission: 'calendar.view' },
  { path: '/forms', permission: 'forms.view' },
  { path: '/requests', permission: 'requests.view-own' },
  { path: '/notifications', permission: 'portal.view' },
  { path: '/profile', permission: 'profile.view' },
  { path: '/profile/edit', permission: 'profile.edit' },
  { path: '/profile/personal', permission: 'profile.edit' },
  { path: '/account', permission: 'portal.view' },
  { path: '/announcements', permission: 'announcements.view' },
  { path: '/helpdesk', permission: 'helpdesk.view' },
  { path: '/helpdesk/new', permission: 'helpdesk.create' },
  { path: '/hr', permission: 'hr.view' },
  { path: '/recruitment', permission: 'recruitment.view' },
  { path: '/recruitment/apply', permission: 'recruitment.apply' },
  { path: '/recruitment/referral', permission: 'recruitment.apply' },
  { path: '/benefits', permission: 'benefits.view' },
  { path: '/resources', permission: 'resources.view' },
  { path: '/search', permission: 'portal.view' },
  // Administration. A path lists every permission that opens it (any one is enough), so HR and IT staff reach only their own
  // modules. Laravel enforces the same rules on /api/admin/*; these entries only decide which pages the UI shows.
  { path: '/admin', permission: ADMIN_AREA_PERMISSIONS },
  { path: '/admin/hr', permission: 'hr.manage' },
  { path: '/admin/hr/employees', permission: ['hr.directory.view', 'hr.directory.manage'] },
  { path: '/admin/hr/employees/create', permission: 'hr.directory.manage' },
  { path: '/admin/hr/employees/import', permission: 'hr.directory.manage' },
  { path: '/admin/hr/departments', permission: 'hr.departments.manage' },
  { path: '/admin/hr/approvals', permission: 'hr.approvals.manage' },
  { path: '/admin/hr/company', permission: 'hr.company.manage' },
  { path: '/admin/users', permission: 'users.manage' },
  { path: '/admin/reports', permission: 'reports.view' },
  { path: '/admin/access', permission: 'users.manage' },
  { path: '/admin/roles', permission: ['roles.view', 'users.manage'] },
  { path: '/admin/permissions', permission: ['roles.view', 'users.manage'] },
  { path: '/admin/announcements', permission: ['announcements.manage', 'announcements.hr-manage'] },
  { path: '/admin/calendar', permission: 'calendar.manage' },
  { path: '/admin/documents', permission: ['documents.manage', 'documents.hr-manage', 'documents.it-manage'] },
  { path: '/admin/document-categories', permission: ['documents.manage', 'documents.hr-manage', 'documents.it-manage'] },
  { path: '/admin/forms', permission: 'forms.manage' },
  { path: '/admin/request-types', permission: 'requests.manage' },
  { path: '/admin/requests', permission: ['requests.manage', 'requests.hr-review', 'requests.team-review', 'requests.it-review'] },
  { path: '/admin/helpdesk', permission: 'helpdesk.manage' },
  { path: '/admin/benefits', permission: 'benefits.manage' },
  { path: '/admin/recruitment', permission: 'recruitment.manage' },
  { path: '/admin/resources', permission: ['resources.manage', 'resources.it-manage'] },
  { path: '/admin/notifications', permission: 'notifications.manage' },
  { path: '/admin/activity-log', permission: 'audit.view' },
  { path: '/admin/settings', permission: 'settings.manage' },
]

const sorted = [...routePermissions].sort((a, b) => b.path.length - a.path.length)

/** The permission(s) required for a pathname (any one suffices), or undefined when only sign-in is needed. */
export function getRoutePermission(pathname: string): Permission | readonly Permission[] | undefined {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return sorted.find(({ path }) => (path === '/' ? clean === '/' : clean === path || clean.startsWith(`${path}/`)))?.permission
}

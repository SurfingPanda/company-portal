import type { UserRole } from '@/auth/roles'

/**
 * Every permission the portal checks, as one strict union: a typo such as "document.manage" fails to compile.
 *
 * IMPORTANT: permissions drive UI visibility and routing only. Laravel must independently authorize every request
 * (view, create, edit, delete, approve, manage). Nothing here protects data.
 *
 * Meaning of the paired view/manage permissions:
 *  - `hr.view` / `it.view`: the employee-facing HR and IT service pages (every employee).
 *  - `hr.manage` / `it.manage`: future administration of those areas (HR / IT roles). No admin UI exists yet.
 */
export type Permission =
  | 'portal.view'
  | 'policies.view'
  | 'policies.manage'
  | 'directory.view'
  | 'documents.view'
  | 'documents.manage'
  | 'documents.hr-manage'
  | 'documents.it-manage'
  | 'forms.view'
  | 'forms.submit'
  | 'forms.manage'
  | 'requests.view-own'
  | 'requests.submit'
  | 'requests.manage'
  | 'requests.team-view'
  | 'requests.team-review'
  | 'requests.it-review'
  | 'requests.hr-review'
  | 'announcements.view'
  | 'announcements.manage'
  | 'announcements.hr-manage'
  | 'calendar.view'
  | 'calendar.manage'
  | 'benefits.view'
  | 'benefits.manage'
  | 'recruitment.view'
  | 'recruitment.apply'
  | 'recruitment.manage'
  | 'helpdesk.view'
  | 'helpdesk.create'
  | 'helpdesk.manage'
  | 'resources.view'
  | 'resources.manage'
  | 'resources.it-manage'
  | 'profile.view'
  | 'profile.edit'
  | 'hr.view'
  | 'hr.manage'
  | 'it.view'
  | 'it.manage'
  | 'directory.team-view'
  | 'reports.view'
  | 'reports.team-view'
  | 'admin.access'
  | 'users.manage'
  | 'roles.view'
  | 'audit.view'
  | 'settings.manage'
  | 'notifications.manage'
  | 'hr.directory.view'
  | 'hr.directory.manage'
  | 'hr.directory.visibility'
  | 'hr.departments.manage'
  | 'hr.company.manage'
  | 'hr.company.publish'
  | 'hr.approvals.manage'

/** What every employee can do. Other roles add to this. */
const employeePermissions: Permission[] = [
  'portal.view',
  'directory.view',
  'documents.view',
  'forms.view',
  'forms.submit',
  'requests.view-own',
  'requests.submit',
  'announcements.view',
  'calendar.view',
  'benefits.view',
  'recruitment.view',
  'recruitment.apply',
  'helpdesk.view',
  'helpdesk.create',
  'resources.view',
  'profile.view',
  'profile.edit',
  'hr.view',
  'it.view',
  'policies.view',
]

/**
 * Role -> permissions. The single place this mapping lives (pages never repeat it).
 * In production the backend returns the user's permissions and those are preferred; this table is the development/mock
 * source and the fallback shape. `admin` covers portal administration only: it grants no access to payroll,
 * payroll, attendance or other external systems.
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
  employee: employeePermissions,
  manager: [...employeePermissions, 'requests.team-view', 'requests.team-review', 'directory.team-view', 'reports.team-view'],
  hr: [...employeePermissions, 'hr.directory.view', 'hr.directory.manage', 'hr.directory.visibility', 'hr.departments.manage', 'hr.company.manage', 'hr.company.publish', 'hr.approvals.manage', 'hr.manage', 'requests.hr-review', 'policies.manage', 'benefits.manage', 'recruitment.manage', 'documents.hr-manage', 'announcements.hr-manage', 'reports.view'],
  it: [...employeePermissions, 'it.manage', 'helpdesk.manage', 'requests.it-review', 'documents.it-manage', 'resources.it-manage'],
  admin: [
    ...employeePermissions,
    'documents.manage',
    'forms.manage',
    'requests.manage',
    'announcements.manage',
    'calendar.manage',
    'benefits.manage',
    'recruitment.manage',
    'helpdesk.manage',
    'resources.manage',
    'hr.manage',
    'it.manage',
    'reports.view',
    'admin.access',
    'users.manage',
    'roles.view',
    'audit.view',
    'settings.manage',
    'notifications.manage',
    'hr.directory.view',
    'hr.directory.manage',
    'hr.directory.visibility',
    'hr.departments.manage',
    'hr.company.manage',
    'hr.company.publish',
    'hr.approvals.manage',
    'policies.manage',
  ],
}

/** Union of the permissions for a set of roles. */
export function permissionsForRoles(roles: readonly UserRole[]): Permission[] {
  return [...new Set(roles.flatMap((role) => rolePermissions[role] ?? []))]
}

/**
 * Holding ANY of these opens the administration area (each module then needs its own permission, see routePermissions).
 * `admin.access` alone grants only the dashboard: it does not by itself open user, content or settings pages.
 */
export const ADMIN_AREA_PERMISSIONS: readonly Permission[] = [
  'admin.access',
  'users.manage',
  'requests.manage',
  'requests.hr-review',
  'helpdesk.manage',
  'announcements.manage',
  'announcements.hr-manage',
  'calendar.manage',
  'documents.manage',
  'documents.hr-manage',
  'documents.it-manage',
  'recruitment.manage',
  'benefits.manage',
  'resources.manage',
  'resources.it-manage',
  'forms.manage',
  'requests.team-review',
  'requests.it-review',
  'hr.approvals.manage',
  'hr.manage',
  'hr.directory.view',
  'hr.directory.manage',
  'hr.departments.manage',
  'hr.company.manage',
  'policies.manage',
  'reports.view',
]

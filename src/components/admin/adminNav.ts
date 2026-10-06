import type { Permission } from '@/auth/permissions'

export interface AdminNavItem {
  label: string
  href: string
  /** Shown when the person holds ANY of these (UI only; Laravel enforces the same rule on the API). */
  permissions: readonly Permission[]
  /** Highlight only on an exact path match (for items whose path is a prefix of other items). */
  end?: boolean
}

export interface AdminNavGroup {
  label: string
  items: AdminNavItem[]
}

const documents: Permission[] = ['documents.manage', 'documents.hr-manage', 'documents.it-manage']

/** The administration menu. Every item lists the permissions that open it, matching src/auth/routePermissions.ts. */
export const adminNavigation: { top: AdminNavItem; groups: AdminNavGroup[] } = {
  top: { label: 'Dashboard', href: '/admin/dashboard', permissions: [] },
  groups: [
    {
      label: 'User Management',
      items: [
        { label: 'Users', href: '/admin/users', permissions: ['users.manage'] },
        { label: 'Access', href: '/admin/access', permissions: ['users.manage'] },
        { label: 'Roles', href: '/admin/roles', permissions: ['roles.view', 'users.manage'] },
        { label: 'Permissions', href: '/admin/permissions', permissions: ['roles.view', 'users.manage'] },
      ],
    },
    {
      label: 'HR Management',
      items: [
        { label: 'HR Dashboard', href: '/admin/hr', permissions: ['hr.manage'], end: true },
        { label: 'Employee Directory', href: '/admin/hr/employees', permissions: ['hr.directory.view', 'hr.directory.manage'] },
        { label: 'Departments', href: '/admin/hr/departments', permissions: ['hr.departments.manage'] },
        { label: 'Approval Routing', href: '/admin/hr/approvals', permissions: ['hr.approvals.manage'] },
        { label: 'Policies', href: '/admin/policies', permissions: ['policies.manage'] },
        { label: 'Company Information', href: '/admin/hr/company', permissions: ['hr.company.manage'], end: true },
        { label: 'Company History', href: '/admin/hr/company/history', permissions: ['hr.company.manage'] },
        { label: 'Leadership', href: '/admin/hr/company/leadership', permissions: ['hr.company.manage'] },
        { label: 'Company Locations', href: '/admin/hr/company/locations', permissions: ['hr.company.manage'] },
        { label: 'HR Documents', href: '/admin/documents', permissions: ['documents.manage', 'documents.hr-manage'] },
        { label: 'HR Forms', href: '/admin/forms', permissions: ['forms.manage'] },
        { label: 'Benefits Content', href: '/admin/benefits', permissions: ['benefits.manage'] },
        { label: 'Recruitment Content', href: '/admin/recruitment/jobs', permissions: ['recruitment.manage'] },
        { label: 'HR Requests', href: '/admin/requests', permissions: ['requests.manage', 'requests.hr-review'] },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Announcements', href: '/admin/announcements', permissions: ['announcements.manage', 'announcements.hr-manage'] },
        { label: 'Documents', href: '/admin/documents', permissions: documents },
        { label: 'Document Categories', href: '/admin/document-categories', permissions: documents },
        { label: 'Forms', href: '/admin/forms', permissions: ['forms.manage'] },
        { label: 'Request Types', href: '/admin/request-types', permissions: ['requests.manage'] },
        { label: 'Calendar', href: '/admin/calendar', permissions: ['calendar.manage'] },
        { label: 'Benefits', href: '/admin/benefits', permissions: ['benefits.manage'] },
        { label: 'Resources', href: '/admin/resources', permissions: ['resources.manage', 'resources.it-manage'] },
      ],
    },
    {
      label: 'IT Management',
      items: [
        { label: 'IT Requests', href: '/admin/requests', permissions: ['requests.it-review'] },
        { label: 'Helpdesk', href: '/admin/helpdesk/tickets', permissions: ['helpdesk.manage'] },
      ],
    },
    {
      label: 'Operations',
      items: [
        { label: 'Requests', href: '/admin/requests', permissions: ['requests.team-review'] },
        { label: 'Job Postings', href: '/admin/recruitment/jobs', permissions: ['recruitment.manage'] },
        { label: 'Applications', href: '/admin/recruitment/applications', permissions: ['recruitment.manage'] },
        { label: 'Referrals', href: '/admin/recruitment/referrals', permissions: ['recruitment.manage'] },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Notifications', href: '/admin/notifications', permissions: ['notifications.manage'] },
        { label: 'Activity Log', href: '/admin/activity-log', permissions: ['audit.view'] },
        { label: 'Settings', href: '/admin/settings', permissions: ['settings.manage'] },
      ],
    },
  ],
}

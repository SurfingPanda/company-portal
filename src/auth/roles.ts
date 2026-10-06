/**
 * Portal roles. These are SYSTEM roles that decide what a person may do in the portal, not job titles
 * (an "IT Technician" may have the "it" role; the title never grants anything).
 * Role assignment happens on the server. There is no UI for employees to change a role.
 */
export const USER_ROLES = ['employee', 'manager', 'hr', 'it', 'admin'] as const

export type UserRole = (typeof USER_ROLES)[number]

export const roleLabels: Record<UserRole, string> = {
  employee: 'Regular Employee',
  manager: 'Manager',
  hr: 'HR Staff',
  it: 'IT Staff',
  admin: 'Administrator',
}

/**
 * The roles an administrator chooses from, in the order they are offered. The three everyday roles come first; HR and IT staff
 * are department access that sits on top of ordinary employee access.
 */
export const roleChoices: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrator', description: 'Manages the portal: users, roles, content, settings and the audit log.' },
  { value: 'manager', label: 'Manager', description: 'Everything a regular employee can do, plus reviewing team requests.' },
  { value: 'employee', label: 'Regular Employee', description: 'Standard access: own requests, tickets, profile, directory, documents and forms.' },
  { value: 'hr', label: 'HR Staff (department access)', description: 'Regular access plus managing employee records, HR content and HR requests.' },
  { value: 'it', label: 'IT Staff (department access)', description: 'Regular access plus running the helpdesk and IT content.' },
]

/** Display name for a role value; unknown values are shown as they are. */
export const roleLabel = (role: string): string => roleLabels[role as UserRole] ?? role

/** Narrows an unknown value (e.g. from an API response) to a known role. Unknown roles are ignored. */
export const isUserRole = (value: unknown): value is UserRole => typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value)

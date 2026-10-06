import type { Permission } from '@/auth/permissions'
import type { UserRole } from '@/auth/roles'

/**
 * Administration types. They describe Laravel's /api/admin responses (snake_case on the wire). Nothing here models HR record data:
 * a portal user is only a login linked to the employee record by `employee_id`.
 */

/** Laravel resource-collection page. */
export interface AdminPage<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

/**
 * pending: account exists but is not activated, cannot sign in. active: can sign in. inactive: no portal access.
 * suspended: access temporarily blocked. The backend enforces all four on sign-in and on every request.
 */
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending'

export interface AdminUser {
  id: number
  employee_id: string
  email: string
  display_name: string
  status: AccountStatus
  roles: UserRole[]
  last_login_at: string | null
  created_at: string | null
  updated_at: string | null
  is_sample: boolean
  /** Detail view only. */
  permissions?: Permission[]
  activity?: { at: string; action: string; description: string; source: 'account' | 'admin' }[]
}

export interface AdminRole {
  id: number
  name: UserRole
  label: string
  description: string
  users_count: number
  permissions: Permission[]
}

export interface PermissionGroup {
  module: string
  label: string
  permissions: { name: Permission; roles: UserRole[] }[]
}

export interface AuditEntry {
  id: number
  created_at: string
  actor: string | null
  action: string
  module: string
  target: string | null
  target_type: string | null
  target_id: number | null
  result: 'success' | 'denied' | 'failed'
  ip_address: string | null
  details: Record<string, unknown> | null
}

/** Only the groups the signed-in person may manage are present. */
export interface AdminDashboardData {
  users?: { total: number; active: number; pending: number }
  requests?: { pending: number }
  helpdesk?: { open: number }
  announcements?: { drafts: number }
  events?: { upcoming: number }
  documents?: { published: number }
  recruitment?: { open_applications: number }
}

export interface SettingsResponse {
  data: Record<string, string | null>
  meta: { groups: Record<string, { key: string; label: string; value: string | null }[]> }
}

/** A content record as the generic CRUD screens handle it (each module's fields are described by its config). */
export type AdminRecord = { id: number } & Record<string, unknown>

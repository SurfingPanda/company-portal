import type { Permission } from '@/auth/permissions'
import type { UserRole } from '@/auth/roles'
/**
 * The signed-in employee. Shaped for a future Laravel `users` + `employees` join:
 * users.employee_id, employees.department_id / location_id / manager_id.
 *
 * Contains business/contact information only: no passwords, tokens, government IDs, salary,
 * payroll, tax or medical data. Those belong to restricted systems.
 */
export type EmploymentStatus = 'active' | 'inactive' | 'on_leave'

export interface UserPreferences {
  language: string
  /** IANA time zone, e.g. "Asia/Manila". */
  timezone: string
  dateFormat: 'MMM D, YYYY' | 'MM/DD/YYYY' | 'DD/MM/YYYY'
}

export interface AuthenticatedUser {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  preferredName?: string
  workEmail: string
  workPhone?: string
  personalEmail?: string
  mobileNumber?: string
  jobTitle: string
  departmentId: string
  departmentName: string
  location?: string
  /** ISO date (yyyy-mm-dd). HR-managed; shown only if approved for display. */
  dateJoined?: string
  employmentStatus: EmploymentStatus
  /** False until the person finishes the first sign-in setup. Undefined (mock mode) means there is nothing to finish. */
  onboardingCompleted?: boolean
  avatarUrl?: string
  managerId?: string
  managerName?: string
  /** Matching record in the Employee Directory (Authenticated User -> Employee -> Directory Profile). */
  directoryEmployeeId?: string
  /** ISO date-time of the last self-service profile change. */
  profileUpdatedAt?: string
  preferences: UserPreferences
  /**
   * Portal roles, assigned by the server (never editable in the UI). Not the same as `jobTitle`.
   * Permissions are derived from roles via auth/permissions.ts unless the backend sends an explicit `permissions` list,
   * which is then preferred. Both only shape the UI; Laravel authorizes every request.
   */
  roles: UserRole[]
  permissions?: Permission[]
  /** True for development sample data. */
  isSample?: boolean
}

/** The only fields an employee may change themselves. Everything else is maintained by HR. */
export type ProfileUpdate = Partial<Pick<AuthenticatedUser, 'preferredName' | 'personalEmail' | 'mobileNumber' | 'avatarUrl'>>

/**
 * Who owns a profile field. "hr" fields are entered by HR in the portal and are read-only for the employee (they change
 * through an HR request); "portal" fields are employee self-service. Not shown to employees; it mirrors what the
 * backend accepts from PUT /api/profile.
 */
export type EmployeeFieldSource = 'portal' | 'hr'

import type { AuthenticatedUser, EmployeeFieldSource, EmploymentStatus } from '@/types/user'

export const getUserFullName = (user: Pick<AuthenticatedUser, 'firstName' | 'lastName'>) => `${user.firstName} ${user.lastName}`

/** Name used in greetings: preferred name when set, otherwise first name. */
export const getUserDisplayName = (user: Pick<AuthenticatedUser, 'firstName' | 'preferredName'>) => user.preferredName?.trim() || user.firstName

export const employmentStatusLabels: Record<EmploymentStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
}

/** Shown wherever an action needs real authentication, which does not exist yet. */
export const AUTH_PLACEHOLDER_MESSAGE = 'This feature will be available when account authentication is connected.'
export const SIGN_OUT_PLACEHOLDER_MESSAGE = 'Sign-out functionality will be connected when authentication is implemented.'

/** Field ownership. HR-controlled fields are never editable in the portal. */
export const employeeFieldSources: Record<string, EmployeeFieldSource> = {
  employeeId: 'hr',
  jobTitle: 'hr',
  departmentName: 'hr',
  employmentStatus: 'hr',
  workEmail: 'hr',
  workPhone: 'hr',
  location: 'hr',
  dateJoined: 'hr',
  managerName: 'hr',
  preferredName: 'portal',
  personalEmail: 'portal',
  mobileNumber: 'portal',
  avatarUrl: 'portal',
}

export const HR_MANAGED_NOTE = 'Some employee information is maintained by HR and can only be updated by HR (send an HR request).'

import type { Permission } from '@/auth/permissions'
import type { UserRole } from '@/auth/roles'
import type { AuthenticatedUser } from '@/types/user'

/**
 * Laravel's `UserResource` (snake_case, wrapped in `{ data }`) -> the portal's `AuthenticatedUser`.
 *
 * Portal fields come from the portal database. Official fields (job title, department …) come from the linked employee record and are null
 * until it is connected: they are mapped to empty strings (never invented) and the UI shows its normal "not available" text.
 */
export interface ApiUser {
  id: number
  employee_id: string
  email: string
  display_name: string
  account_status: string
  onboarding_completed: boolean
  roles: string[]
  permissions: string[]
  profile: { preferred_name: string | null; personal_email: string | null; mobile_number: string | null; avatar_url: string | null; updated_at: string | null }
  official: { connected: boolean; full_name: string | null; job_title: string | null; department: string | null; location: string | null; employment_status: string | null; date_joined: string | null; manager: string | null }
  is_sample: boolean
}

export function mapApiUser(api: ApiUser): AuthenticatedUser {
  const fullName = api.official.full_name ?? api.display_name
  const [firstName, ...rest] = fullName.split(' ')
  return {
    id: String(api.id),
    employeeId: api.employee_id,
    firstName,
    lastName: rest.join(' '),
    preferredName: api.profile.preferred_name ?? undefined,
    workEmail: api.email,
    personalEmail: api.profile.personal_email ?? undefined,
    mobileNumber: api.profile.mobile_number ?? undefined,
    avatarUrl: api.profile.avatar_url ?? undefined,
    jobTitle: api.official.job_title ?? '',
    departmentId: '',
    departmentName: api.official.department ?? '',
    location: api.official.location ?? undefined,
    employmentStatus: api.official.employment_status === 'on_leave' ? 'on_leave' : api.official.employment_status === 'inactive' ? 'inactive' : 'active',
    dateJoined: api.official.date_joined ?? undefined,
    managerName: api.official.manager ?? undefined,
    onboardingCompleted: api.onboarding_completed,
    profileUpdatedAt: api.profile.updated_at ?? undefined,
    preferences: { language: 'en', timezone: 'Asia/Manila', dateFormat: 'MMM D, YYYY' },
    roles: api.roles as UserRole[],
    permissions: api.permissions as Permission[],
    isSample: api.is_sample,
  }
}

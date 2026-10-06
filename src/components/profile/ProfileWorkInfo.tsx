import { ProfileField } from '@/components/profile/ProfileField'
import { ProfileSection } from '@/components/profile/ProfileSection'
import { roleLabels } from '@/auth/roles'
import { formatDate } from '@/lib/format'
import { employmentStatusLabels } from '@/lib/user'
import type { AuthenticatedUser } from '@/types/user'

/** Employment information. HR-managed, so every field is read-only. */
export function ProfileWorkInfo({ user }: { user: AuthenticatedUser }) {
  return (
    <ProfileSection id="employment-info-heading" title="Employment Information" description="Maintained by HR. Send an HR request to change it.">
      <ProfileField label="Employee ID" value={user.employeeId} mono readOnly />
      <ProfileField label="Job Title" value={user.jobTitle} readOnly />
      <ProfileField label="Department" value={`${user.departmentName} Department`} readOnly />
      <ProfileField label="Employment Status" value={employmentStatusLabels[user.employmentStatus]} readOnly />
      <ProfileField label="Location" value={user.location} readOnly />
      <ProfileField label="Date Joined" value={user.dateJoined ? formatDate(user.dateJoined, 'long') : undefined} readOnly />
      <ProfileField label="Manager" value={user.managerName} readOnly />
      <ProfileField label="Portal Role" value={user.roles.map((r) => roleLabels[r]).join(', ')} helper="Set by the portal administrators. It is not your job title." readOnly />
    </ProfileSection>
  )
}

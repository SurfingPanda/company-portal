import { Link } from 'react-router-dom'
import { ProfileField } from '@/components/profile/ProfileField'
import { ProfileSection } from '@/components/profile/ProfileSection'
import type { AuthenticatedUser } from '@/types/user'

/** Work contact: business contact details, all HR/company-managed (read-only). */
export function ProfileContactInfo({ user }: { user: AuthenticatedUser }) {
  return (
    <ProfileSection
      id="work-contact-heading"
      title="Work Contact"
      action={
        <Link to="/company/departments" className="text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline">
          View Department →
        </Link>
      }
    >
      <ProfileField
        label="Company Email"
        value={
          <a href={`mailto:${user.workEmail}`} className="text-primary hover:underline">
            {user.workEmail}
          </a>
        }
        readOnly
      />
      <ProfileField label="Phone / Extension" value={user.workPhone} readOnly />
      <ProfileField label="Office Location" value={user.location} readOnly />
      <ProfileField label="Department" value={`${user.departmentName} Department`} readOnly />
    </ProfileSection>
  )
}

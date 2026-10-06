import { Link } from 'react-router-dom'
import { ProfileField } from '@/components/profile/ProfileField'
import { ProfileSection } from '@/components/profile/ProfileSection'
import type { AuthenticatedUser } from '@/types/user'

/** Personal contact: the only profile details the employee can edit. Visible to the signed-in employee only, never in the Directory. */
export function ProfilePersonalInfo({ user }: { user: AuthenticatedUser }) {
  return (
    <ProfileSection
      id="personal-contact-heading"
      title="Personal Contact"
      description="You can update these yourself."
      action={
        <Link to="/profile/edit" className="text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline">
          Edit →
        </Link>
      }
    >
      <ProfileField label="Preferred Name" value={user.preferredName} editable />
      <ProfileField label="Personal Email" value={user.personalEmail} editable />
      <ProfileField label="Mobile Number" value={user.mobileNumber} editable />
      <p className="pt-3 text-sm">
        <Link to="/profile/personal" className="font-medium text-primary underline-offset-4 hover:underline">
          Personal details and emergency contacts →
        </Link>
      </p>
    </ProfileSection>
  )
}

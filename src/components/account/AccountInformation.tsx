import { Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProfileField } from '@/components/profile/ProfileField'
import { ProfileSection } from '@/components/profile/ProfileSection'
import { Button } from '@/components/ui/button'
import { getUserFullName } from '@/lib/user'
import type { AuthenticatedUser } from '@/types/user'

/** Read-only account summary from the central user, with a link to manage employee information on the profile. */
export function AccountInformation({ user }: { user: AuthenticatedUser }) {
  return (
    <div className="space-y-4">
      <ProfileSection id="account-info-heading" title="Account Information" description="Read-only. These details come from the organization.">
        <ProfileField label="Name" value={getUserFullName(user)} readOnly />
        <ProfileField label="Company Email" value={user.workEmail} readOnly />
        <ProfileField label="Employee ID" value={user.employeeId} mono readOnly />
        <ProfileField label="Department" value={`${user.departmentName} Department`} readOnly />
      </ProfileSection>
      <Button asChild variant="outline" size="sm" className="bg-white">
        <Link to="/profile">Manage Employee Information</Link>
      </Button>
      <p role="note" className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Some employee information is managed by HR and cannot be changed directly in the Employee Portal. Contact HR or use the appropriate employee request process for updates.
      </p>
    </div>
  )
}

import { CircleCheck, Info } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmployeeInformationRequests, HrManagedNote } from '@/components/profile/EmployeeInformationRequests'
import { ProfileContactInfo } from '@/components/profile/ProfileContactInfo'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfilePersonalInfo } from '@/components/profile/ProfilePersonalInfo'
import { ProfileError, ProfileSkeleton } from '@/components/profile/ProfileStates'
import { ProfileWorkInfo } from '@/components/profile/ProfileWorkInfo'
import { useAuth } from '@/context/AuthContext'

export default function ProfilePage() {
  const { user, isLoading, error, retry } = useAuth()
  const location = useLocation()
  const justUpdated = (location.state as { updated?: boolean } | null)?.updated === true

  let content
  if (error) content = <ProfileError onRetry={retry} />
  else if (isLoading || !user) content = <ProfileSkeleton />
  else
    content = (
      <div className="space-y-8">
        {justUpdated && (
          <p role="status" className="flex items-center gap-2 border border-gold/40 bg-white px-4 py-3 text-sm font-medium text-primary">
            <CircleCheck className="size-4 text-gold" aria-hidden="true" />
            Profile updated successfully.
          </p>
        )}
        <ProfileHeader user={user} />
        {user.isSample && (
          <div role="note" className="flex items-start gap-3 border border-dashed border-muted-foreground/40 bg-white px-4 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-foreground/80">
              <span className="font-semibold text-foreground">Sample profile.</span> This is fictional development data, not an official ELJIN employee record. Changes you make stay in this browser session only.
            </p>
          </div>
        )}
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
          <ProfileWorkInfo user={user} />
          <ProfileContactInfo user={user} />
          <ProfilePersonalInfo user={user} />
        </div>
        <HrManagedNote />
        <EmployeeInformationRequests />
      </div>
    )

  return (
    <PageContainer className="pb-16">
      <PageHeader title="My Profile" description="Your employee information and contact details." breadcrumbs={[{ label: 'My Profile' }]} />
      <div className="mt-6">{content}</div>
    </PageContainer>
  )
}

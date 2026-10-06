import { MapPin } from 'lucide-react'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { EmployeeAvatar } from '@/components/common/EmployeeAvatar'
import { ProfileActions } from '@/components/profile/ProfileActions'
import { employmentStatusLabels, getUserFullName } from '@/lib/user'
import { cn } from '@/lib/utils'
import type { AuthenticatedUser } from '@/types/user'

/** Identity block: avatar, name, job title, department, employee ID, status and location. */
export function ProfileHeader({ user }: { user: AuthenticatedUser }) {
  const fullName = getUserFullName(user)

  return (
    <section aria-labelledby="profile-name" className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <EmployeeAvatar name={fullName} imageUrl={user.avatarUrl} className="size-20 text-xl [&_span]:text-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 id="profile-name" className="font-serif text-3xl font-semibold tracking-tight text-primary">
              {fullName}
            </h1>
            {user.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
          </div>
          {user.preferredName && <p className="text-sm text-muted-foreground">Preferred name: {user.preferredName}</p>}
          <p className="mt-1 text-base text-foreground">{user.jobTitle}</p>
          <p className="text-sm text-muted-foreground">{user.departmentName} Department</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/80">
            <span>
              Employee ID: <span className="font-mono">{user.employeeId}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span aria-hidden="true" className={cn('size-1.5 rounded-full', user.employmentStatus === 'active' ? 'bg-gold' : 'bg-amber-500')} />
              {employmentStatusLabels[user.employmentStatus]}
            </span>
            {user.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {user.location}
              </span>
            )}
          </p>
        </div>
        <ProfileActions />
      </div>
    </section>
  )
}

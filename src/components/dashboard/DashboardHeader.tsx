import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmployeeAvatar } from '@/components/common/EmployeeAvatar'
import { PageContainer } from '@/components/layout/PageContainer'
import { HomeSearch } from '@/components/search/HomeSearch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { employmentStatusLabels, getUserDisplayName, getUserFullName } from '@/lib/user'
import { formatToday, getGreeting } from '@/utils/greeting'

/**
 * Compact personalised header: greeting, today's date, search, and a small employee summary.
 * Everything about the employee comes from the central `AuthenticatedUser`. Shows no pay, leave, attendance or ID data.
 */
export function DashboardHeader() {
  const { user, isLoading } = useAuth()
  const now = new Date()
  const greeting = `${getGreeting(now)}${user ? `, ${getUserDisplayName(user)}.` : '.'}`
  const fullName = user ? getUserFullName(user) : undefined

  return (
    <section aria-labelledby="dashboard-greeting" className="border-b border-t-2 border-t-primary bg-white">
      <PageContainer className="grid gap-5 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            <time dateTime={now.toISOString().slice(0, 10)}>{formatToday(now)}</time>
          </p>
          <h1 id="dashboard-greeting" className="mt-1 font-serif text-3xl font-semibold tracking-tight text-primary">
            {user || isLoading ? greeting : 'Welcome back.'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening in the employee portal.</p>
          <div className="mt-4">
            <HomeSearch />
          </div>
        </div>

        <div aria-label="Employee summary" role="group" className="flex items-center gap-3 border-t pt-4 lg:min-w-72 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          {isLoading ? (
            <>
              <Skeleton className="size-12 rounded-sm" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40 rounded-sm" />
                <Skeleton className="h-3 w-32 rounded-sm" />
              </div>
            </>
          ) : user && fullName ? (
            <>
              <EmployeeAvatar name={fullName} imageUrl={user.avatarUrl} className="size-12" />
              <div className="min-w-0 text-sm leading-snug">
                <p className="truncate font-semibold text-primary">{fullName}</p>
                <p className="truncate text-foreground/80">{user.jobTitle}</p>
                <p className="truncate text-xs text-muted-foreground">{user.departmentName} Department</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                  {user.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" aria-hidden="true" />
                      {user.location}
                    </span>
                  )}
                  <span>{employmentStatusLabels[user.employmentStatus]}</span>
                  <Link to="/profile" className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                    My Profile
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <Link to="/profile" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              My Profile
            </Link>
          )}
        </div>
      </PageContainer>
    </section>
  )
}

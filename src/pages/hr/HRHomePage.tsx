import { Link } from 'react-router-dom'
import { HRPageShell } from '@/components/hr/HRPageShell'
import { HRQuickAccess } from '@/components/hr/HRQuickAccess'
import { HRResourceLinks } from '@/components/hr/HRResourceLinks'
import { HRServiceList } from '@/components/hr/HRServiceList'
import { HRCardsSkeleton, HRErrorState, HRSection, SampleHRNotice } from '@/components/hr/HRStates'
import { LeaveRequestCard } from '@/components/hr/LeaveRequestCard'
import { useAsync } from '@/hooks/useAsync'
import { getHRServices, getRecentLeaveRequests } from '@/services/hrService'

const linkClass = 'shrink-0 text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline focus-visible:outline-2 focus-visible:outline-ring'
const rowClass = 'block px-4 py-3 text-sm font-medium text-primary hover:bg-accent hover:underline focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

function EmployeeInformation() {
  return (
    <ul aria-label="Employee information" className="divide-y border bg-white">
      <li>
        <Link to="/profile" className={rowClass}>
          View My Profile
        </Link>
      </li>
      <li>
        <Link to="/profile/edit" className={rowClass}>
          Edit Allowed Profile Information
        </Link>
      </li>
      <li>
        <Link to="/forms?category=hr" className={rowClass}>
          Employee Forms
        </Link>
      </li>
      <li>
        <Link to="/forms/rt-hr-document" className={rowClass}>
          Employee Records Requests
        </Link>
      </li>
    </ul>
  )
}

function RecentLeave() {
  const { data, error, retry } = useAsync(() => getRecentLeaveRequests(3), [])
  if (error) return <HRErrorState onRetry={retry} />
  if (!data) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (data.length === 0) return <p className="border bg-white px-4 py-6 text-sm text-muted-foreground">You have not submitted any leave requests yet.</p>
  return (
    <ul aria-label="Recent leave requests" className="divide-y border bg-white">
      {data.map((r) => (
        <li key={r.id}>
          <LeaveRequestCard request={r} />
        </li>
      ))}
    </ul>
  )
}

export default function HRHomePage() {
  const { data, error, retry } = useAsync(() => getHRServices(), [])
  const featured = data?.filter((s) => s.isFeatured)

  return (
    <HRPageShell title="HR & Employee Services" description="Provide employees with a central place to access HR services, forms, information, and requests.">
      <div className="space-y-10">
        <SampleHRNotice />

        <HRSection id="hr-quick-heading" title="HR Quick Access">
          <HRQuickAccess />
        </HRSection>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="min-w-0 space-y-10 lg:col-span-2">
            <HRSection
              id="hr-featured-heading"
              title="Featured Services"
              action={
                <Link to="/hr/services" className={linkClass}>
                  All HR Services →
                </Link>
              }
            >
              {error ? <HRErrorState onRetry={retry} /> : !featured ? <HRCardsSkeleton cards={3} /> : <HRServiceList services={featured} />}
            </HRSection>

            <HRSection id="hr-employee-heading" title="Employee Information">
              <EmployeeInformation />
            </HRSection>
          </div>

          <div className="min-w-0 space-y-10">
            <HRSection
              id="hr-recent-heading"
              title="My Leave Requests"
              action={
                <Link to="/hr/leave/requests" className={linkClass}>
                  View All →
                </Link>
              }
            >
              <RecentLeave />
            </HRSection>

            <HRSection id="hr-resources-heading" title="HR Documents">
              <HRResourceLinks />
            </HRSection>
          </div>
        </div>
      </div>
    </HRPageShell>
  )
}

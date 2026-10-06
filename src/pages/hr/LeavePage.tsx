import { ArrowRight, CalendarPlus, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HRPageShell } from '@/components/hr/HRPageShell'
import { HRErrorState, HRSection, SampleHRNotice } from '@/components/hr/HRStates'
import { LeaveRequestCard } from '@/components/hr/LeaveRequestCard'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/hooks/useAsync'
import { getRecentLeaveRequests } from '@/services/hrService'

const tileClass = 'flex h-full flex-col border bg-white p-4'
const iconBox = 'flex size-9 shrink-0 items-center justify-center border bg-secondary text-primary'

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

export default function LeavePage() {
  return (
    <HRPageShell title="Leave" description="File a leave request and follow its status. Requests are reviewed by HR." trail={[{ label: 'Leave' }]}>
      <div className="space-y-10">
        <SampleHRNotice text="Leave types and requests here are fictional examples. No leave balance is shown because the portal does not hold one." />

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Leave services">
          <li>
            <article className={tileClass}>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className={iconBox}>
                  <CalendarPlus className="size-[18px]" strokeWidth={1.5} />
                </span>
                <div>
                  <h2 className="font-serif text-lg font-semibold leading-tight text-primary">Leave Request</h2>
                  <p className="mt-1 text-[0.8125rem] text-muted-foreground">Fill in the dates and reason for your leave.</p>
                </div>
              </div>
              <Button asChild size="sm" className="mt-4 self-start">
                <Link to="/hr/leave/request">
                  New Leave Request <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </article>
          </li>
          <li>
            <article className={tileClass}>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className={iconBox}>
                  <ListChecks className="size-[18px]" strokeWidth={1.5} />
                </span>
                <div>
                  <h2 className="font-serif text-lg font-semibold leading-tight text-primary">My Leave Requests</h2>
                  <p className="mt-1 text-[0.8125rem] text-muted-foreground">Search and track the leave requests you submitted.</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-4 self-start bg-white text-primary">
                <Link to="/hr/leave/requests">
                  View Requests <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </article>
          </li>
        </ul>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <HRSection
              id="leave-recent-heading"
              title="Recent Leave Requests"
              action={
                <Link to="/hr/leave/requests" className="shrink-0 text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                  View All →
                </Link>
              }
            >
              <RecentLeave />
            </HRSection>
          </div>

          <div className="min-w-0 space-y-10">
            <HRSection id="leave-docs-heading" title="Leave Documents">
              <ul className="divide-y border bg-white text-sm">
                <li>
                  <Link to="/documents/doc-003" className="block px-4 py-3 font-medium text-primary hover:bg-accent hover:underline focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
                    Leave Policy
                  </Link>
                </li>
                <li>
                  <Link to="/forms/form-leave" className="block px-4 py-3 font-medium text-primary hover:bg-accent hover:underline focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
                    Leave Request Form
                  </Link>
                </li>
              </ul>
            </HRSection>

            <HRSection id="leave-info-heading" title="General Information">
              <p className="text-sm leading-relaxed text-foreground/85">
                Your request is reviewed by HR. Approval, leave credits and payroll effects are handled by HR, not calculated by this portal. This is sample guidance until HR provides official information.
              </p>
            </HRSection>
          </div>
        </div>
      </div>
    </HRPageShell>
  )
}

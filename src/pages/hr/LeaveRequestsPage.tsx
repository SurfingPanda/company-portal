import { Link } from 'react-router-dom'
import { DirectoryPagination } from '@/components/directory/DirectoryPagination'
import { HRPageShell } from '@/components/hr/HRPageShell'
import { HREmptyState, HRErrorState, HRListSkeleton, SampleHRNotice } from '@/components/hr/HRStates'
import { LeaveRequestFilters } from '@/components/hr/LeaveRequestFilters'
import { LeaveRequestList } from '@/components/hr/LeaveRequestList'
import { Button } from '@/components/ui/button'
import { useLeaveRequestBrowser } from '@/hooks/useLeaveRequestBrowser'

export default function LeaveRequestsPage() {
  const { query, data, error, loading, retry, searchInput, setSearchInput, update, hasFilters, clearFilters } = useLeaveRequestBrowser()

  let body
  if (error) {
    body = <HRErrorState title="Unable to load leave requests" onRetry={retry} />
  } else if (!data) {
    body = <HRListSkeleton label="Loading leave requests" />
  } else if (data.total === 0) {
    body = hasFilters ? (
      <HREmptyState title="No leave requests found." message="No leave requests match your search or filters." action={{ label: 'Clear Filters', onClick: clearFilters }} />
    ) : (
      <HREmptyState title="No Leave Requests" message="You have not submitted any leave requests yet." action={{ label: 'New Leave Request', to: '/hr/leave/request' }} />
    )
  } else {
    body = (
      <>
        <LeaveRequestList requests={data.data} busy={loading} />
        <DirectoryPagination
          page={data.current_page}
          lastPage={data.last_page}
          total={data.total}
          perPage={data.per_page}
          onPageChange={(p) => {
            update({ page: p > 1 ? String(p) : undefined })
            window.scrollTo({ top: 0 })
          }}
        />
      </>
    )
  }

  return (
    <HRPageShell
      title="My Leave Requests"
      description="Leave requests you submitted through the Employee Portal."
      trail={[{ label: 'Leave', href: '/hr/leave' }, { label: 'My Leave Requests' }]}
      actions={
        <Button asChild variant="outline" className="bg-white">
          <Link to="/hr/leave/request">New Leave Request</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <SampleHRNotice text="These are fictional sample requests. Requests you submit here are kept in this browser session only." />
        <div className="border bg-white p-4 sm:p-5">
          <LeaveRequestFilters query={query} search={searchInput} onSearchChange={setSearchInput} onChange={update} />
        </div>
        <section aria-label="Leave requests">
          {data && data.total > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" aria-live="polite">
              <p>
                <span className="font-semibold text-foreground">
                  {data.total} {data.total === 1 ? 'request' : 'requests'}
                </span>
              </p>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                  Clear Filters
                </button>
              )}
            </div>
          )}
          {body}
        </section>
      </div>
    </HRPageShell>
  )
}

import { JobFilters } from '@/components/recruitment/JobFilters'
import { JobList } from '@/components/recruitment/JobList'
import { JobSearch } from '@/components/recruitment/JobSearch'
import { RecruitmentEmptyState, RecruitmentErrorState, RecruitmentListSkeleton, RecruitmentNotice, SAMPLE_JOBS_NOTICE } from '@/components/recruitment/RecruitmentEmptyState'
import { RecruitmentHeader } from '@/components/recruitment/RecruitmentHeader'
import { useJobBrowser } from '@/hooks/useJobBrowser'

export default function JobsPage() {
  const { query, data, error, loading, retry, searchInput, setSearchInput, update, hasFilters, clearFilters } = useJobBrowser()

  let body
  if (error) body = <RecruitmentErrorState onRetry={retry} />
  else if (!data) body = <RecruitmentListSkeleton label="Loading job openings" />
  else if (data.length === 0)
    body = hasFilters ? (
      <RecruitmentEmptyState title="No positions found." message="No job openings match your search or filters." action={{ label: 'Clear Filters', onClick: clearFilters }} />
    ) : (
      <RecruitmentEmptyState title="No Current Openings" message="There are no job openings available at this time." />
    )
  else body = <JobList jobs={data} busy={loading} />

  return (
    <RecruitmentHeader title="Job Openings" description="Search and filter current positions. Only open positions are shown by default." trail={[{ label: 'Job Openings' }]}>
      <div className="space-y-6">
        <RecruitmentNotice>{SAMPLE_JOBS_NOTICE}</RecruitmentNotice>
        <div className="space-y-4 border bg-white p-4 sm:p-5">
          <JobSearch value={searchInput} onChange={setSearchInput} />
          <JobFilters query={query} onChange={update} />
        </div>
        <section aria-label="Job openings">
          {data && data.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" aria-live="polite">
              <p>
                <span className="font-semibold text-foreground">
                  {data.length} {data.length === 1 ? 'position' : 'positions'}
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
    </RecruitmentHeader>
  )
}

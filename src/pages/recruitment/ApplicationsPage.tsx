import { Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DirectoryPagination } from '@/components/directory/DirectoryPagination'
import { ApplicationList } from '@/components/recruitment/ApplicationList'
import { RecruitmentEmptyState, RecruitmentErrorState, RecruitmentListSkeleton, RecruitmentNotice } from '@/components/recruitment/RecruitmentEmptyState'
import { RecruitmentHeader } from '@/components/recruitment/RecruitmentHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RECRUITMENT_CONFIG } from '@/config/recruitment'
import { useApplicationBrowser } from '@/hooks/useApplicationBrowser'
import { applicationStatusLabels } from '@/lib/recruitment'

const ALL = 'all'
const labelClass = 'mb-1 block text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground'

export default function ApplicationsPage() {
  const { query, data, error, loading, retry, searchInput, setSearchInput, update, hasFilters, clearFilters } = useApplicationBrowser()

  let body
  if (error) {
    body = <RecruitmentErrorState title="Unable to load applications" onRetry={retry} />
  } else if (!data) {
    body = <RecruitmentListSkeleton label="Loading applications" />
  } else if (data.total === 0) {
    body = hasFilters ? (
      <RecruitmentEmptyState title="No applications found." message="No applications match your search or filters." action={{ label: 'Clear Filters', onClick: clearFilters }} />
    ) : (
      <RecruitmentEmptyState title="No Applications" message="You have not submitted any applications through the portal yet." action={{ label: 'Browse Job Openings', to: '/recruitment/jobs' }} />
    )
  } else {
    body = (
      <>
        <ApplicationList applications={data.data} busy={loading} />
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
    <RecruitmentHeader
      title="My Applications"
      description="Applications you submitted through the Employee Portal."
      trail={[{ label: 'My Applications' }]}
      actions={
        <Button asChild variant="outline" className="bg-white">
          <Link to="/recruitment/jobs">Browse Job Openings</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <RecruitmentNotice>
          {RECRUITMENT_CONFIG.externalApplicationEnabled
            ? 'Applications made in the connected recruitment system are tracked there. The records below are demonstration data.'
            : 'Application tracking is not currently connected to a recruitment system. These are fictional records, and applications you submit are kept in this browser session only.'}
        </RecruitmentNotice>

        <div className="space-y-4 border bg-white p-4 sm:p-5">
          <div role="search">
            <label htmlFor="app-search" className="sr-only">
              Search applications by reference, position or status
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
              <Input
                id="app-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search applications..."
                autoComplete="off"
                className="h-12 border-primary/40 bg-white pl-12 pr-11 text-base md:text-base [&::-webkit-search-cancel-button]:hidden"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-0 flex-1 basis-44">
              <label htmlFor="app-status" className={labelClass}>
                Status
              </label>
              <Select value={query.status ?? ALL} onValueChange={(v) => update({ status: v === ALL ? undefined : v })}>
                <SelectTrigger id="app-status" className="h-9 w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Statuses</SelectItem>
                  {Object.entries(applicationStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 basis-44">
              <label htmlFor="app-sort" className={labelClass}>
                Sort by Date
              </label>
              <Select value={query.sort} onValueChange={(v) => update({ sort: v === 'newest' ? undefined : v })}>
                <SelectTrigger id="app-sort" className="h-9 w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <section aria-label="Applications">
          {data && data.total > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" aria-live="polite">
              <p>
                <span className="font-semibold text-foreground">
                  {data.total} {data.total === 1 ? 'application' : 'applications'}
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

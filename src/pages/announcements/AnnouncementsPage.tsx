import { DirectoryPagination } from '@/components/directory/DirectoryPagination'
import { AnnouncementFilters } from '@/components/announcements/AnnouncementFilters'
import { AnnouncementList } from '@/components/announcements/AnnouncementList'
import { AnnouncementSearch } from '@/components/announcements/AnnouncementSearch'
import { AnnouncementEmptyState, AnnouncementErrorState, AnnouncementLoadingState, SampleAnnouncementsNotice } from '@/components/announcements/AnnouncementStates'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAnnouncementBrowser } from '@/hooks/useAnnouncementBrowser'

export default function AnnouncementsPage() {
  const browser = useAnnouncementBrowser()
  const { data, error, loading, retry, hasFilters, clearFilters, update } = browser

  let results
  if (error) {
    results = <AnnouncementErrorState onRetry={retry} />
  } else if (!data) {
    results = <AnnouncementLoadingState />
  } else if (data.data.length === 0) {
    results = <AnnouncementEmptyState onClear={hasFilters ? clearFilters : undefined} />
  } else {
    results = (
      <>
        <AnnouncementList announcements={data.data} busy={loading} />
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
    <PageContainer className="pb-16">
      <PageHeader title="Announcements" description="Company updates, notices, and important communications." breadcrumbs={[{ label: 'Announcements' }]} />
      <SampleAnnouncementsNotice className="mt-6" />

      <div className="mt-6 space-y-4 border bg-white p-4 sm:p-5">
        <AnnouncementSearch value={browser.searchInput} onChange={browser.setSearchInput} />
        <AnnouncementFilters query={browser.query} onChange={update} />
      </div>

      <section aria-label="Announcement results" className="mt-8">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" aria-live="polite">
          {data && (
            <p>
              <span className="font-semibold text-foreground">{data.total} announcements</span>
            </p>
          )}
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
              Clear Filters
            </button>
          )}
        </div>
        {results}
      </section>
    </PageContainer>
  )
}

import { DirectoryPagination } from '@/components/directory/DirectoryPagination'
import { DocumentEmptyState } from '@/components/documents/DocumentEmptyState'
import { DocumentErrorState } from '@/components/documents/DocumentErrorState'
import { DocumentLoadingState } from '@/components/documents/DocumentLoadingState'
import { DocumentTable } from '@/components/documents/DocumentTable'
import type { DocumentBrowser } from '@/hooks/useDocumentBrowser'

/** Summary, list and pagination for a document browser, including loading, empty and error states. */
export function DocumentResults({ browser }: { browser: DocumentBrowser }) {
  const { data, error, loading, retry, hasFilters, clearFilters, update } = browser

  if (error) return <DocumentErrorState onRetry={retry} />
  if (!data) return <DocumentLoadingState />

  return (
    <section aria-label="Documents">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-live="polite">
        <p>
          <span className="font-semibold text-foreground">{data.total} documents</span>
        </p>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
            Clear Filters
          </button>
        )}
      </div>
      {data.data.length === 0 ? (
        <DocumentEmptyState onClear={clearFilters} />
      ) : (
        <>
          <DocumentTable documents={data.data} busy={loading} />
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
      )}
    </section>
  )
}

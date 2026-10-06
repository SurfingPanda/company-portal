import { Link } from 'react-router-dom'
import { DirectoryPagination } from '@/components/directory/DirectoryPagination'
import { HelpdeskPageShell } from '@/components/helpdesk/HelpdeskPageShell'
import { HelpdeskErrorState, ListSkeleton, SampleHelpdeskNotice, TicketsEmptyState } from '@/components/helpdesk/HelpdeskStates'
import { TicketFilters } from '@/components/helpdesk/TicketFilters'
import { TicketList } from '@/components/helpdesk/TicketList'
import { Button } from '@/components/ui/button'
import { useTicketBrowser } from '@/hooks/useTicketBrowser'

export default function TicketsPage() {
  const browser = useTicketBrowser()
  const { data, error, loading, retry, hasFilters, clearFilters, update } = browser

  let results
  if (error) results = <HelpdeskErrorState onRetry={retry} />
  else if (!data) results = <ListSkeleton />
  else if (data.data.length === 0) results = <TicketsEmptyState onClear={hasFilters ? clearFilters : undefined} />
  else
    results = (
      <>
        <TicketList tickets={data.data} busy={loading} />
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

  return (
    <HelpdeskPageShell
      title="My Tickets"
      description="Track the IT support tickets you have submitted."
      trail={[{ label: 'My Tickets' }]}
      actions={
        <Button asChild size="sm">
          <Link to="/helpdesk/new">Submit a Request</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <SampleHelpdeskNotice />
        <div className="border bg-white p-4 sm:p-5">
          <TicketFilters query={browser.query} search={browser.searchInput} onSearchChange={browser.setSearchInput} onChange={update} />
        </div>
        <section aria-label="Ticket results">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" aria-live="polite">
            {data && (
              <p>
                <span className="font-semibold text-foreground">{data.total} tickets</span>
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
      </div>
    </HelpdeskPageShell>
  )
}

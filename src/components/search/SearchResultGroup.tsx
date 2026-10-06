import { typeFilterLabels } from '@/components/search/SearchFilters'
import { SearchResultItem } from '@/components/search/SearchResultItem'
import type { GlobalSearchResult, SearchResultType } from '@/types/search'

/** One type's results under a heading. Used when "Group by type" is on. */
export function SearchResultGroup({ type, results, onOpen }: { type: SearchResultType; results: GlobalSearchResult[]; onOpen?: () => void }) {
  const headingId = `search-group-${type}`
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="border-b-2 border-primary pb-1.5 font-serif text-lg font-semibold text-primary">
        {typeFilterLabels[type]} <span className="text-sm font-normal text-muted-foreground">({results.length})</span>
      </h2>
      <ul className="mt-2 divide-y border bg-white">
        {results.map((r) => (
          <li key={r.id}>
            <SearchResultItem result={r} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </section>
  )
}

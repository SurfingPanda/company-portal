import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DirectoryPagination } from '@/components/directory/DirectoryPagination'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchEmptyState, SearchErrorState, SearchLoadingState } from '@/components/search/SearchEmptyState'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SearchInput } from '@/components/search/SearchInput'
import { SearchResultGroup } from '@/components/search/SearchResultGroup'
import { SearchResultItem } from '@/components/search/SearchResultItem'
import { SearchSuggestions } from '@/components/search/SearchSuggestions'
import { useAsync } from '@/hooks/useAsync'
import { useRecentSearches } from '@/hooks/useRecentSearches'
import { search } from '@/services/searchService'
import type { GlobalSearchResult, SearchResultType, SearchSort } from '@/types/search'

const TYPES: SearchResultType[] = ['document', 'form', 'service', 'benefit', 'announcement', 'event', 'helpdesk', 'job', 'resource', 'company', 'faq', 'directory']
const SORTS: SearchSort[] = ['relevance', 'newest', 'az']
const PER_PAGE = 20

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const type = TYPES.find((t) => t === params.get('type'))
  const sort = SORTS.find((s) => s === params.get('sort')) ?? 'relevance'
  const grouped = params.get('group') === '1'
  const page = Math.max(1, Number(params.get('page')) || 1)

  const { recent, add, clear } = useRecentSearches()
  const [input, setInput] = useState(q)

  const update = (changes: Record<string, string | undefined>, replace = false) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace },
    )

  // Live search: the URL follows the input after a short pause. Enter / button / suggestion submits immediately.
  useEffect(() => {
    if (input.trim() === q) return
    const timer = setTimeout(() => update({ q: input.trim() || undefined }, true), 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input])

  // Keep the field in step with the URL (back/forward, header search, refresh).
  useEffect(() => {
    setInput(q)
  }, [q])

  const query = useMemo(() => ({ q, type, sort, page, perPage: PER_PAGE }), [q, type, sort, page])
  const { data, error, loading, retry } = useAsync(() => (q ? search(query) : Promise.resolve(undefined)), [JSON.stringify(query)])

  const submit = (value: string) => {
    if (value) add(value)
    update({ q: value || undefined })
  }
  const pick = (value: string) => {
    setInput(value)
    submit(value)
  }

  let body
  if (!q) {
    body = <SearchSuggestions recent={recent} onPick={pick} onClearRecent={clear} />
  } else if (error) {
    body = <SearchErrorState onRetry={retry} />
  } else if (!data) {
    body = <SearchLoadingState />
  } else if (data.total === 0 && Object.keys(data.counts).length === 0) {
    body = <SearchEmptyState />
  } else {
    const groups = grouped ? TYPES.map((t) => [t, data.data.filter((r) => r.type === t)] as const).filter(([, list]) => list.length > 0) : []
    body = (
      <div className="space-y-4">
        <SearchFilters type={type} sort={sort} grouped={grouped} counts={data.counts} total={Object.values(data.counts).reduce((a, b) => a + (b ?? 0), 0)} onChange={(c) => update(c)} />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground">
            {data.total} {data.total === 1 ? 'result' : 'results'}
          </span>{' '}
          for &ldquo;{q}&rdquo;
        </p>
        {data.total === 0 ? (
          <SearchEmptyState />
        ) : grouped ? (
          <div className="space-y-6">
            {groups.map(([t, list]) => (
              <SearchResultGroup key={t} type={t} results={list as GlobalSearchResult[]} onOpen={() => add(q)} />
            ))}
          </div>
        ) : (
          <ul aria-label="Search results" aria-busy={loading} className={`divide-y border bg-white ${loading ? 'opacity-60' : ''}`}>
            {data.data.map((r) => (
              <li key={r.id}>
                <SearchResultItem result={r} onOpen={() => add(q)} />
              </li>
            ))}
          </ul>
        )}
        {data.total > 0 && (
          <DirectoryPagination
            page={data.page}
            lastPage={Math.max(1, Math.ceil(data.total / data.perPage))}
            total={data.total}
            perPage={data.perPage}
            onPageChange={(p) => {
              update({ page: p > 1 ? String(p) : undefined })
              window.scrollTo({ top: 0 })
            }}
          />
        )}
      </div>
    )
  }

  return (
    <PageContainer className="pb-16">
      <PageHeader title="Search Employee Portal" description="Find documents, services, forms, announcements, resources, and other employee information." breadcrumbs={[{ label: 'Search' }]} />
      <div className="mt-6 space-y-6">
        <SearchInput id="search-page-input" value={input} onChange={setInput} onSubmit={submit} size="large" showButton autoFocus={!q} label="Search employee portal" />
        {body}
      </div>
    </PageContainer>
  )
}

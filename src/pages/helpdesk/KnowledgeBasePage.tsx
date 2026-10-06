import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HelpdeskPageShell } from '@/components/helpdesk/HelpdeskPageShell'
import { HelpdeskErrorState, ListSkeleton, SampleHelpdeskNotice } from '@/components/helpdesk/HelpdeskStates'
import { KnowledgeBaseFilters } from '@/components/helpdesk/KnowledgeBaseFilters'
import { KnowledgeBaseList } from '@/components/helpdesk/KnowledgeBaseList'
import { KnowledgeBaseSearch } from '@/components/helpdesk/KnowledgeBaseSearch'
import { knowledgeBaseCategories } from '@/data/helpdeskOptions'
import { useAsync } from '@/hooks/useAsync'
import { getArticles } from '@/services/helpdeskService'

export default function KnowledgeBasePage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? undefined
  const category = knowledgeBaseCategories.find((c) => c.id === params.get('category'))?.id

  const [searchInput, setSearchInput] = useState(search ?? '')
  const query = useMemo(() => ({ search, category }), [search, category])
  const { data, error, retry } = useAsync(() => getArticles(query), [JSON.stringify(query)])

  const update = (changes: Record<string, string | undefined>, replace = false) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
        return next
      },
      { replace },
    )

  useEffect(() => {
    if (searchInput === (params.get('q') ?? '')) return
    const timer = setTimeout(() => update({ q: searchInput }, true), 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const urlSearch = params.get('q') ?? ''
  useEffect(() => {
    setSearchInput(urlSearch)
  }, [urlSearch])

  const hasFilters = Boolean(search?.trim() || category)
  const clear = () => {
    setSearchInput('')
    setParams({})
  }

  return (
    <HelpdeskPageShell title="Knowledge Base" description="Find answers to common IT problems before you submit a request." trail={[{ label: 'Knowledge Base' }]}>
      <div className="space-y-6">
        <SampleHelpdeskNotice text="These help articles are generic sample guidance, not official Eljin procedures." />
        <div className="space-y-4 border bg-white p-4 sm:p-5">
          <KnowledgeBaseSearch value={searchInput} onChange={setSearchInput} />
          <KnowledgeBaseFilters selected={category} onChange={(c) => update({ category: c })} />
        </div>
        <section aria-label="Articles">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" aria-live="polite">
            {data && (
              <p>
                <span className="font-semibold text-foreground">{data.length} articles</span>
              </p>
            )}
            {hasFilters && (
              <button type="button" onClick={clear} className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                Clear Search
              </button>
            )}
          </div>
          {error ? <HelpdeskErrorState onRetry={retry} /> : !data ? <ListSkeleton rows={5} label="Loading articles" /> : <KnowledgeBaseList articles={data} onClear={hasFilters ? clear : undefined} />}
        </section>
      </div>
    </HelpdeskPageShell>
  )
}

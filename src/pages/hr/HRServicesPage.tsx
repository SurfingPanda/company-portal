import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HRPageShell } from '@/components/hr/HRPageShell'
import { HRServiceFilters } from '@/components/hr/HRServiceFilters'
import { HRServiceList } from '@/components/hr/HRServiceList'
import { HRCardsSkeleton, HRErrorState, SampleHRNotice } from '@/components/hr/HRStates'
import { hrServiceCategories } from '@/data/hrServices'
import { useAsync } from '@/hooks/useAsync'
import { getHRServices } from '@/services/hrService'

export default function HRServicesPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? undefined
  const category = hrServiceCategories.find((c) => c === params.get('category'))

  const [searchInput, setSearchInput] = useState(search ?? '')
  const query = useMemo(() => ({ search, category }), [search, category])
  const { data, error, retry } = useAsync(() => getHRServices(query), [JSON.stringify(query)])

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
    <HRPageShell title="HR Services" description="Employee-facing HR services. Requests are reviewed by HR; HR keeps the official records." trail={[{ label: 'Services' }]}>
      <div className="space-y-6">
        <SampleHRNotice text="These services are examples of what the portal can offer. They are not confirmed ELJIN services." />
        <div className="border bg-white p-4 sm:p-5">
          <HRServiceFilters search={searchInput} onSearchChange={setSearchInput} category={category} onCategoryChange={(c) => update({ category: c })} />
        </div>
        <section aria-label="Services">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" aria-live="polite">
            {data && (
              <p>
                <span className="font-semibold text-foreground">{data.length} services</span>
              </p>
            )}
            {hasFilters && (
              <button type="button" onClick={clear} className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                Clear filters
              </button>
            )}
          </div>
          {error ? <HRErrorState onRetry={retry} /> : !data ? <HRCardsSkeleton /> : <HRServiceList services={data} onClear={hasFilters ? clear : undefined} />}
        </section>
      </div>
    </HRPageShell>
  )
}

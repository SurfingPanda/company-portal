import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BenefitFAQ } from '@/components/benefits/BenefitFAQ'
import { BenefitFilters } from '@/components/benefits/BenefitFilters'
import { BenefitSearch } from '@/components/benefits/BenefitSearch'
import { BenefitsPageShell } from '@/components/benefits/BenefitsPageShell'
import { HREmptyState, HRErrorState, HRListSkeleton, SampleHRNotice } from '@/components/hr/HRStates'
import { useAsync } from '@/hooks/useAsync'
import { getBenefitFaqCategories, getBenefitFaqs } from '@/services/benefitService'

export default function BenefitsFAQPage() {
  const [params, setParams] = useSearchParams()
  const { data: categoryData } = useAsync(() => getBenefitFaqCategories(), [])
  const categories = useMemo(() => categoryData ?? [], [categoryData])
  const search = params.get('q') ?? undefined
  const category = categories.find((c) => c === params.get('category'))

  const [searchInput, setSearchInput] = useState(search ?? '')
  const query = useMemo(() => ({ search, category }), [search, category])
  const { data, error, retry } = useAsync(() => getBenefitFaqs(query), [JSON.stringify(query)])

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

  let body
  if (error) body = <HRErrorState onRetry={retry} />
  else if (!data) body = <HRListSkeleton rows={5} label="Loading questions" />
  else if (data.length === 0)
    body = <HREmptyState title="No results" message="No frequently asked questions matched your search." action={hasFilters ? { label: 'Clear Filters', onClick: clear } : undefined} />
  else body = <BenefitFAQ faqs={data} />

  return (
    <BenefitsPageShell title="Benefits FAQ" description="Common questions about finding benefits information and submitting requests." trail={[{ label: 'FAQ' }]}>
      <div className="space-y-6">
        <SampleHRNotice text="Answers are generic sample guidance until HR provides approved answers." />
        <div className="space-y-4 border bg-white p-4 sm:p-5">
          <BenefitSearch value={searchInput} onChange={setSearchInput} id="faq-search" label="Search frequently asked questions" placeholder="Search questions..." />
          <BenefitFilters label="Filter by topic" options={categories.map((c) => ({ value: c, label: c }))} selected={category} onChange={(c) => update({ category: c })} />
        </div>
        <section aria-label="Questions">
          {data && data.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" aria-live="polite">
              <p>
                <span className="font-semibold text-foreground">
                  {data.length} {data.length === 1 ? 'question' : 'questions'}
                </span>
              </p>
              {hasFilters && (
                <button type="button" onClick={clear} className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                  Clear Filters
                </button>
              )}
            </div>
          )}
          {body}
        </section>
      </div>
    </BenefitsPageShell>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BenefitAssistance } from '@/components/benefits/BenefitAssistance'
import { BenefitFilters } from '@/components/benefits/BenefitFilters'
import { BenefitList } from '@/components/benefits/BenefitList'
import { BenefitResourceLinks } from '@/components/benefits/BenefitResourceLinks'
import { BenefitSearch } from '@/components/benefits/BenefitSearch'
import { BenefitsPageShell } from '@/components/benefits/BenefitsPageShell'
import { HRCardsSkeleton, HREmptyState, HRErrorState, HRSection, SampleHRNotice } from '@/components/hr/HRStates'
import { useAsync } from '@/hooks/useAsync'
import { getBenefitCategories, getBenefits } from '@/services/benefitService'
import type { BenefitCategoryId } from '@/types/benefit'

const linkClass = 'shrink-0 text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline focus-visible:outline-2 focus-visible:outline-ring'

export default function BenefitsPage() {
  const [params, setParams] = useSearchParams()
  const { data: categories } = useAsync(getBenefitCategories, [])

  const search = params.get('q') ?? undefined
  // Only categories that exist in the data are valid filters.
  const category = categories?.find((c) => c.id === params.get('category'))?.id as BenefitCategoryId | undefined
  const query = useMemo(() => ({ search, category }), [search, category])
  const { data, error, loading, retry } = useAsync(() => getBenefits(query), [JSON.stringify(query)])

  const [searchInput, setSearchInput] = useState(search ?? '')

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

  const featured = !hasFilters ? data?.filter((b) => b.isFeatured) : undefined
  const rest = !hasFilters ? data?.filter((b) => !b.isFeatured) : data

  let body
  if (error) body = <HRErrorState onRetry={retry} />
  else if (!data) body = <HRCardsSkeleton cards={6} />
  else if (data.length === 0)
    body = hasFilters ? (
      <HREmptyState title="No benefits found." message="No benefits matched your search." action={{ label: 'Clear Filters', onClick: clear }} />
    ) : (
      <HREmptyState title="No Benefits Information" message="Benefits information has not yet been published." />
    )
  else
    body = (
      <div className="space-y-8">
        {featured && featured.length > 0 && (
          <HRSection id="benefit-featured-heading" title="Featured Resources">
            <BenefitList benefits={featured} label="Featured benefits" busy={loading} />
          </HRSection>
        )}
        {rest && rest.length > 0 && (
          <HRSection id="benefit-all-heading" title={hasFilters ? 'Results' : 'All Benefit Information'}>
            <BenefitList benefits={rest} label="Benefits" busy={loading} />
          </HRSection>
        )}
      </div>
    )

  return (
    <BenefitsPageShell title="Benefits & Employee Resources" description="Access employee benefit information, guides, forms, and related resources.">
      <div className="space-y-10">
        <SampleHRNotice text="Benefit entries are demonstration records, not confirmed ELJIN benefits. No coverage, amounts or eligibility rules are shown. Official benefits information is kept by HR." />

        <HRSection id="benefit-overview-heading" title="Benefits Overview">
          <p className="max-w-3xl text-sm leading-relaxed text-foreground/85">
            Use this area to find benefit information, guides and forms, and to send HR a question or request. The portal does not calculate benefits or hold your benefit records; those stay with HR.
          </p>
        </HRSection>

        <section aria-label="Find benefits" className="space-y-4 border bg-white p-4 sm:p-5">
          <BenefitSearch value={searchInput} onChange={setSearchInput} id="benefit-search" label="Search benefits by name, description or category" placeholder="Search benefits..." />
          {categories && (
            <BenefitFilters label="Filter by category" options={categories.map((c) => ({ value: c.id, label: c.label, count: c.count }))} selected={category} onChange={(c) => update({ category: c })} />
          )}
        </section>

        <section aria-label="Benefits">
          {data && data.length > 0 && hasFilters && (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" aria-live="polite">
              <p>
                <span className="font-semibold text-foreground">
                  {data.length} {data.length === 1 ? 'benefit' : 'benefits'}
                </span>
              </p>
              <button type="button" onClick={clear} className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                Clear Filters
              </button>
            </div>
          )}
          {body}
        </section>

        <HRSection
          id="benefit-resources-heading"
          title="Employee Resources"
          action={
            <Link to="/benefits/resources" className={linkClass}>
              All Resources →
            </Link>
          }
        >
          <BenefitResourceLinks />
        </HRSection>

        <BenefitAssistance />
      </div>
    </BenefitsPageShell>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BenefitSearch } from '@/components/benefits/BenefitSearch'
import { HREmptyState, HRErrorState, HRListSkeleton, HRSection, SampleHRNotice } from '@/components/hr/HRStates'
import { DocumentPreviewList } from '@/components/resources/DocumentPreviewList'
import { FeaturedResources } from '@/components/resources/FeaturedResources'
import { ResourceCard, resourceGridClass } from '@/components/resources/ResourceCard'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'
import { ResourceCategoryCard } from '@/components/resources/ResourceCategoryCard'
import { ResourceFilters } from '@/components/resources/ResourceFilters'
import { ResourceQuickLinks } from '@/components/resources/ResourceQuickLinks'
import { ResourcesPageShell } from '@/components/resources/ResourcesPageShell'
import { Button } from '@/components/ui/button'
import { benefitsLinks, resourceCategories } from '@/data/resources'
import { useAsync } from '@/hooks/useAsync'
import { getResourceCategories, getResources, resourceTypeLabels } from '@/services/resourceService'
import type { ResourceCategoryId, ResourceType } from '@/types/resource'

const linkClass = 'shrink-0 text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline focus-visible:outline-2 focus-visible:outline-ring'
const rowClass = 'block px-4 py-2.5 text-sm font-medium text-primary hover:bg-accent hover:underline focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

export default function ResourcesPage() {
  const [params, setParams] = useSearchParams()
  const { preferences } = usePortalPreferences()
  const search = params.get('q') ?? undefined
  const category = resourceCategories.find((c) => c.id === params.get('category'))?.id as ResourceCategoryId | undefined
  const type = (Object.keys(resourceTypeLabels) as ResourceType[]).find((t) => t === params.get('type'))

  const hasFilters = Boolean(search?.trim() || category || type)
  const query = useMemo(() => ({ search, category, type }), [search, category, type])

  const [searchInput, setSearchInput] = useState(search ?? '')
  const { data: categories } = useAsync(getResourceCategories, [])
  // Only search the index when there is something to search for.
  const { data: results, error, loading, retry } = useAsync(() => (hasFilters ? getResources(query) : Promise.resolve(undefined)), [JSON.stringify(query)])

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
    const timer = setTimeout(() => update({ q: searchInput }, true), 200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const urlSearch = params.get('q') ?? ''
  useEffect(() => {
    setSearchInput(urlSearch)
  }, [urlSearch])

  const clear = () => {
    setSearchInput('')
    setParams({})
  }

  let resultsBlock
  if (hasFilters) {
    if (error) resultsBlock = <HRErrorState onRetry={retry} />
    else if (!results) resultsBlock = <HRListSkeleton rows={5} label="Searching resources" />
    else if (results.length === 0)
      resultsBlock = <HREmptyState title="No resources found." message="Try another keyword or browse one of the categories below." action={{ label: 'Clear Search', onClick: clear }} />
    else
      resultsBlock = (
        <section aria-label="Search results">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground" aria-live="polite">
            <p>
              <span className="font-semibold text-foreground">
                {results.length} {results.length === 1 ? 'resource' : 'resources'}
              </span>
            </p>
            <button type="button" onClick={clear} className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
              Clear Search
            </button>
          </div>
          <ul aria-busy={loading} className={`${resourceGridClass(preferences.resourceView)} ${loading ? 'opacity-60' : ''}`}>
            {results.slice(0, 60).map((r) => (
              <li key={r.id} className="bg-white">
                <ResourceCard resource={r} />
              </li>
            ))}
          </ul>
          {results.length > 60 && <p className="mt-2 text-xs text-muted-foreground">Showing the first 60 results. Refine your search to narrow them down.</p>}
        </section>
      )
  }

  return (
    <ResourcesPageShell title="Employee Resource Center" description="Find company resources, employee guides, forms, policies, services, and helpful information in one place.">
      <div className="space-y-10">
        <SampleHRNotice text="This page only points to other portal modules. Many linked documents, guides and services are sample records, not confirmed ELJIN content." />

        <section aria-label="Search resources" className="space-y-4 border bg-white p-4 sm:p-5">
          <BenefitSearch value={searchInput} onChange={setSearchInput} id="resource-search" label="Search resources by title, description, category or keyword" placeholder="Search resources..." />
          <ResourceFilters category={category} type={type} onChange={(c) => update(c)} />
        </section>

        {resultsBlock}

        <HRSection id="resources-quick-heading" title="Quick Access">
          <ResourceQuickLinks />
        </HRSection>

        {!hasFilters && (
          <HRSection id="resources-featured-heading" title="Featured Resources">
            <FeaturedResources />
          </HRSection>
        )}

        <HRSection id="resources-categories-heading" title="Resource Categories">
          {categories ? (
            <ul aria-label="Resource categories" className="grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {categories
                .filter((c) => c.id !== 'faq')
                .map((c) => (
                  <li key={c.id} className="bg-white">
                    <ResourceCategoryCard category={c} />
                  </li>
                ))}
            </ul>
          ) : (
            <HRListSkeleton rows={3} label="Loading categories" />
          )}
        </HRSection>

        {!hasFilters && (
          <>
            <div className="grid gap-10 lg:grid-cols-2">
              <HRSection
                id="resources-policies-heading"
                title="Policies & Guidelines"
                action={
                  <Link to="/documents/policies" className={linkClass}>
                    Documents →
                  </Link>
                }
              >
                <DocumentPreviewList category="policies" label="Policies and guidelines" viewAllHref="/documents/policies" limit={5} />
              </HRSection>

              <HRSection id="resources-benefits-heading" title="Benefits">
                <ul aria-label="Benefits resources" className="divide-y border bg-white">
                  {benefitsLinks.map((l) => (
                    <li key={l.href}>
                      <Link to={l.href} className={rowClass}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </HRSection>
            </div>

            <HRSection id="resources-forms-heading" title="Forms & Requests">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border bg-white p-4">
                  <h3 className="font-serif text-lg font-semibold text-primary">Downloadable Forms</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Documents you fill in outside the portal. Each links to its record in Documents.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm" className="bg-white">
                      <Link to="/forms">All Forms</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="bg-white">
                      <Link to="/forms?category=hr">HR Forms</Link>
                    </Button>
                  </div>
                </div>
                <div className="border bg-white p-4">
                  <h3 className="font-serif text-lg font-semibold text-primary">Online Requests</h3>
                  <p className="mt-1 text-sm text-muted-foreground">HR, IT, employee information, benefits and administrative requests submitted in the portal and tracked with a reference number.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link to="/requests">My Requests</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="bg-white">
                      <Link to="/forms?type=request">Browse Requests</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </HRSection>

            <p className="text-sm text-muted-foreground">
              Looking for quick answers?{' '}
              <Link to="/resources/faq" className="font-medium text-primary underline-offset-4 hover:underline">
                Browse the Employee FAQ
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </ResourcesPageShell>
  )
}

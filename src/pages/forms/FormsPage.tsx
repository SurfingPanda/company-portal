import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionHeading } from '@/components/common/SectionHeading'
import { FormEmptyState, FormErrorState, FormLoadingState, SampleFormsNotice } from '@/components/forms/FormStates'
import { FormFilters } from '@/components/forms/FormFilters'
import { FormList } from '@/components/forms/FormList'
import { FormSearch } from '@/components/forms/FormSearch'
import { RecentRequests } from '@/components/forms/RecentRequests'
import { RequestCategoryList } from '@/components/forms/RequestCategoryList'
import { useAsync } from '@/hooks/useAsync'
import { useFormBrowser } from '@/hooks/useFormBrowser'
import { getFeaturedCatalog } from '@/services/formService'

export default function FormsPage() {
  const browser = useFormBrowser()
  const { data, error, retry, hasFilters, clearFilters } = browser
  const { data: featured } = useAsync(() => getFeaturedCatalog(6), [])

  let available
  if (error) available = <FormErrorState onRetry={retry} />
  else if (!data) available = <FormLoadingState />
  else if (data.length === 0) available = <FormEmptyState onClear={hasFilters ? clearFilters : undefined} />
  else available = <FormList items={data} />

  return (
    <PageContainer className="pb-16">
      <PageHeader
        title="Forms & Requests"
        description="Access employee forms and submit requests for HR, IT, administration, and other company services."
        breadcrumbs={[{ label: 'Forms & Requests' }]}
      />
      <SampleFormsNotice className="mt-6" />

      <div className="mt-6 space-y-4 border bg-white p-4 sm:p-5">
        <FormSearch value={browser.searchInput} onChange={browser.setSearchInput} />
        <FormFilters query={browser.query} onChange={browser.update} />
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
            Clear Filters
          </button>
        )}
      </div>

      <div className="mt-8 space-y-10">
        {!hasFilters && (
          <>
            <RequestCategoryList />
            <section aria-labelledby="frequently-used-forms-heading">
              <SectionHeading id="frequently-used-forms-heading" title="Frequently Used" />
              {featured ? <FormList items={featured} grouped={false} /> : <FormLoadingState cards={3} />}
            </section>
          </>
        )}

        <section aria-labelledby="available-forms-heading">
          <SectionHeading id="available-forms-heading" title="Available Forms & Requests" description={data ? `${data.length} ${data.length === 1 ? 'item' : 'items'}` : undefined} />
          {available}
        </section>

        {!hasFilters && <RecentRequests title="My Requests" headingId="my-requests-heading" />}
      </div>
    </PageContainer>
  )
}

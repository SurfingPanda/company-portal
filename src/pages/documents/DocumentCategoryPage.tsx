import { DocumentFilters } from '@/components/documents/DocumentFilters'
import { DocumentResults } from '@/components/documents/DocumentResults'
import { DocumentSearch } from '@/components/documents/DocumentSearch'
import { SampleNotice } from '@/components/documents/SampleNotice'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { getCategoryInfo } from '@/data/documentCategories'
import { useDocumentBrowser } from '@/hooks/useDocumentBrowser'
import type { DocumentCategory } from '@/types/document'

/** One page component serves every category route; only the `category` prop changes. */
export default function DocumentCategoryPage({ category }: { category: DocumentCategory }) {
  const info = getCategoryInfo(category)
  const browser = useDocumentBrowser(category)

  return (
    <PageContainer className="pb-16">
      <PageHeader
        title={info?.label ?? 'Documents'}
        description={info?.description}
        breadcrumbs={[{ label: 'Documents', href: '/documents' }, { label: info?.label ?? category }]}
      />
      <SampleNotice className="mt-6" />

      <div className="mt-6 space-y-4 border bg-white p-4 sm:p-5">
        <DocumentSearch value={browser.searchInput} onChange={browser.setSearchInput} />
        <DocumentFilters query={browser.query} onChange={browser.update} hideCategory />
      </div>

      <div className="mt-8">
        <DocumentResults browser={browser} />
      </div>
    </PageContainer>
  )
}

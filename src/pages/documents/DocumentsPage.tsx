import { Link } from 'react-router-dom'
import { CompanyResourcesDocuments } from '@/components/documents/CompanyResourcesDocuments'
import { DocumentCategoryList } from '@/components/documents/DocumentCategoryList'
import { DocumentFilters } from '@/components/documents/DocumentFilters'
import { DocumentResults } from '@/components/documents/DocumentResults'
import { DocumentSearch } from '@/components/documents/DocumentSearch'
import { FrequentlyUsedDocuments } from '@/components/documents/FrequentlyUsedDocuments'
import { RecentDocuments } from '@/components/documents/RecentDocuments'
import { SampleNotice } from '@/components/documents/SampleNotice'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDocumentBrowser } from '@/hooks/useDocumentBrowser'

export default function DocumentsPage() {
  const browser = useDocumentBrowser()
  const showResults = browser.hasFilters || browser.showAll

  return (
    <PageContainer className="pb-16">
      <PageHeader
        title="Documents & Resources"
        description="Access company policies, forms, manuals, templates, and other employee resources."
        breadcrumbs={[{ label: 'Documents' }]}
      />
      <SampleNotice className="mt-6" />

      <div className="mt-6 space-y-4 border bg-white p-4 sm:p-5">
        <DocumentSearch value={browser.searchInput} onChange={browser.setSearchInput} />
        <DocumentFilters query={browser.query} onChange={browser.update} />
      </div>

      <div className="mt-8 space-y-10">
        {showResults ? (
          <>
            {!browser.hasFilters && (
              <p className="text-sm">
                <Link to="/documents" className="text-primary underline-offset-4 hover:underline">
                  ← Back to overview
                </Link>
              </p>
            )}
            <DocumentResults browser={browser} />
          </>
        ) : (
          <>
            <DocumentCategoryList />
            <div className="grid gap-10 lg:grid-cols-2">
              <RecentDocuments />
              <FrequentlyUsedDocuments />
            </div>
            <CompanyResourcesDocuments />
          </>
        )}
      </div>
    </PageContainer>
  )
}

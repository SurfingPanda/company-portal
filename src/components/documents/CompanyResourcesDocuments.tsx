import { SectionHeading, SectionLink } from '@/components/common/SectionHeading'
import { DocumentCompactList } from '@/components/documents/DocumentCompactList'
import { DocumentErrorState } from '@/components/documents/DocumentErrorState'
import { DocumentLoadingState } from '@/components/documents/DocumentLoadingState'
import { useAsync } from '@/hooks/useAsync'
import { getDocuments } from '@/services/documentService'

/** Preview of the "Company Resources" category on the Documents landing page. */
export function CompanyResourcesDocuments() {
  const { data, error, retry } = useAsync(() => getDocuments({ category: 'company', sort: 'az', perPage: 4 }), [])

  return (
    <section aria-labelledby="company-resources-heading">
      <SectionHeading
        id="company-resources-heading"
        title="Company Resources"
        action={<SectionLink href="/documents?category=company">View all</SectionLink>}
      />
      {error ? (
        <DocumentErrorState onRetry={retry} />
      ) : !data ? (
        <DocumentLoadingState rows={4} />
      ) : (
        <DocumentCompactList documents={data.data} label="Company resources" />
      )}
    </section>
  )
}

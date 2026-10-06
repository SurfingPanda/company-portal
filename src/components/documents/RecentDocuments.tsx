import { SectionHeading } from '@/components/common/SectionHeading'
import { DocumentCompactList } from '@/components/documents/DocumentCompactList'
import { DocumentErrorState } from '@/components/documents/DocumentErrorState'
import { DocumentLoadingState } from '@/components/documents/DocumentLoadingState'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { getRecentDocuments } from '@/services/documentService'

export function RecentDocuments() {
  const { data, error, retry } = useAsync(() => getRecentDocuments(5), [])

  return (
    <section aria-labelledby="recent-documents-heading">
      <SectionHeading id="recent-documents-heading" title="Recently Added" />
      {error ? (
        <DocumentErrorState onRetry={retry} />
      ) : !data ? (
        <DocumentLoadingState rows={5} />
      ) : (
        <>
          <DocumentCompactList documents={data} label="Recently added documents" />
          <Link
            to="/documents?view=all"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            View all documents →
          </Link>
        </>
      )}
    </section>
  )
}

import { SectionHeading } from '@/components/common/SectionHeading'
import { DocumentCompactList } from '@/components/documents/DocumentCompactList'
import { DocumentErrorState } from '@/components/documents/DocumentErrorState'
import { DocumentLoadingState } from '@/components/documents/DocumentLoadingState'
import { useAsync } from '@/hooks/useAsync'
import { getFrequentlyUsedDocuments } from '@/services/documentService'

export function FrequentlyUsedDocuments() {
  const { data, error, retry } = useAsync(() => getFrequentlyUsedDocuments(6), [])

  return (
    <section aria-labelledby="frequently-used-heading">
      <SectionHeading id="frequently-used-heading" title="Frequently Used" />
      {error ? (
        <DocumentErrorState onRetry={retry} />
      ) : !data ? (
        <DocumentLoadingState rows={6} />
      ) : (
        <DocumentCompactList documents={data} label="Frequently used documents" />
      )}
    </section>
  )
}

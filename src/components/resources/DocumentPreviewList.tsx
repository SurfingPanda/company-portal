import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { HREmptyState, HRErrorState, HRListSkeleton } from '@/components/hr/HRStates'
import { useAsync } from '@/hooks/useAsync'
import { getDocuments } from '@/services/documentService'
import type { DocumentCategory } from '@/types/document'

/** A short preview of existing Documents-module records for one category. Files and metadata stay in Documents. */
export function DocumentPreviewList({ category, limit = 5, label, viewAllHref }: { category: DocumentCategory; limit?: number; label: string; viewAllHref: string }) {
  const { data, error, retry } = useAsync(() => getDocuments({ category, perPage: limit }), [category, limit])

  if (error) return <HRErrorState onRetry={retry} />
  if (!data) return <HRListSkeleton rows={Math.min(limit, 4)} label={`Loading ${label}`} />
  if (data.data.length === 0) return <HREmptyState title="No documents yet" message="No documents have been published in this category." />

  return (
    <div>
      <ul aria-label={label} className="divide-y border bg-white">
        {data.data.map((d) => (
          <li key={d.id}>
            <Link to={`/documents/${d.id}`} className="flex flex-wrap items-center gap-x-2 px-4 py-2.5 text-sm font-medium text-primary hover:bg-accent hover:underline focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
              {d.title}
              {d.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
              <span className="text-xs font-normal text-muted-foreground">{d.fileType}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs">
        <Link to={viewAllHref} className="font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline">
          View all →
        </Link>
      </p>
    </div>
  )
}

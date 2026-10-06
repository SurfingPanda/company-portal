import { Link } from 'react-router-dom'
import { DocumentTypeIcon } from '@/components/documents/DocumentTypeIcon'
import { getCategoryInfo } from '@/data/documentCategories'
import { formatDate } from '@/lib/format'
import type { DocumentResource } from '@/types/document'

interface DocumentCompactListProps {
  documents: DocumentResource[]
  /** Accessible name for the list. */
  label: string
}

/** Dense list used by Recently Added, Frequently Used and Company Resources. */
export function DocumentCompactList({ documents, label }: DocumentCompactListProps) {
  return (
    <ul aria-label={label} className="border bg-white">
      {documents.map((doc) => (
        <li key={doc.id} className="border-b border-border last:border-b-0">
          <Link
            to={`/documents/${doc.id}`}
            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <DocumentTypeIcon fileType={doc.fileType} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-primary group-hover:underline">{doc.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {getCategoryInfo(doc.category)?.label} · {doc.fileType}
              </span>
            </span>
            <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:block">
              Updated {formatDate(doc.updatedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

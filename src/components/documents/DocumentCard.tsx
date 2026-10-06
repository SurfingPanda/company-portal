import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AccessLabel } from '@/components/documents/AccessLabel'
import { FileTypeBadge } from '@/components/documents/DocumentTypeIcon'
import { getCategoryInfo } from '@/data/documentCategories'
import { formatDate } from '@/lib/format'
import type { DocumentResource } from '@/types/document'

/** Compact document entry for small screens. */
export function DocumentCard({ document }: { document: DocumentResource }) {
  return (
    <Link
      to={`/documents/${document.id}`}
      className="block px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <FileTypeBadge fileType={document.fileType} />
      <span className="mt-1.5 block text-sm font-semibold text-primary">{document.title}</span>
      <span className="block text-[0.8125rem] text-foreground/80">
        {getCategoryInfo(document.category)?.label} · {document.department}
      </span>
      <AccessLabel level={document.accessLevel} />
      <span className="mt-1 block text-xs text-muted-foreground">Updated {formatDate(document.updatedAt)}</span>
      <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
        View Document <ArrowRight className="size-3.5" aria-hidden="true" />
      </span>
    </Link>
  )
}

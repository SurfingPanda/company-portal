import { Link } from 'react-router-dom'
import { AccessLabel } from '@/components/documents/AccessLabel'
import { DocumentActionsMenu } from '@/components/documents/DocumentActionsMenu'
import { DocumentCard } from '@/components/documents/DocumentCard'
import { DocumentTypeIcon, FileTypeBadge } from '@/components/documents/DocumentTypeIcon'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getCategoryInfo } from '@/data/documentCategories'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DocumentResource } from '@/types/document'

interface DocumentTableProps {
  documents: DocumentResource[]
  /** Dims the list while new results load. */
  busy?: boolean
}

const head = 'h-10 text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground'

/** Table on md+ screens; compact cards below. Both render the same documents. */
export function DocumentTable({ documents, busy }: DocumentTableProps) {
  return (
    <div className={cn('border bg-white transition-opacity', busy && 'opacity-60')} aria-busy={busy}>
      <ul className="divide-y md:hidden" aria-label="Documents">
        {documents.map((doc) => (
          <li key={doc.id}>
            <DocumentCard document={doc} />
          </li>
        ))}
      </ul>

      <Table className="hidden md:table">
        <TableHeader className="bg-secondary">
          <TableRow className="hover:bg-secondary">
            <TableHead className={head}>Document</TableHead>
            <TableHead className={cn(head, 'hidden lg:table-cell')}>Category</TableHead>
            <TableHead className={cn(head, 'hidden lg:table-cell')}>Department</TableHead>
            <TableHead className={head}>File Type</TableHead>
            <TableHead className={head}>Updated</TableHead>
            <TableHead className={cn(head, 'text-right')}>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const category = getCategoryInfo(doc.category)?.label
            return (
              <TableRow key={doc.id} className="hover:bg-accent">
                <TableCell className="py-3 whitespace-normal">
                  <div className="flex items-start gap-3">
                    <DocumentTypeIcon fileType={doc.fileType} />
                    <div className="min-w-0">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {doc.title}
                      </Link>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{doc.description}</p>
                      <p className="text-xs text-muted-foreground lg:hidden">
                        {category} · {doc.department}
                      </p>
                      <AccessLabel level={doc.accessLevel} />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden whitespace-normal text-sm lg:table-cell">{category}</TableCell>
                <TableCell className="hidden whitespace-normal text-sm lg:table-cell">{doc.department}</TableCell>
                <TableCell>
                  <FileTypeBadge fileType={doc.fileType} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">{formatDate(doc.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="outline" size="sm" className="bg-white">
                      <Link to={`/documents/${doc.id}`} aria-label={`View ${doc.title}`}>
                        View
                      </Link>
                    </Button>
                    <DocumentActionsMenu document={doc} />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

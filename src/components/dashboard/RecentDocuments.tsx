import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { SectionHeading, SectionLink } from '@/components/common/SectionHeading'
import { SectionError } from '@/components/dashboard/SectionBoundary'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryInfo } from '@/data/documentCategories'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/format'
import { getDocuments } from '@/services/documentService'

/** Most recently updated documents, from the Documents module (default sort is "recently updated"). */
export function RecentDocuments({ limit = 5 }: { limit?: number }) {
  const { data, error, retry } = useAsync(() => getDocuments({ perPage: limit }), [limit])

  return (
    <section aria-labelledby="recent-documents-heading">
      <SectionHeading id="recent-documents-heading" title="Recent Documents" action={<SectionLink href="/documents">Browse Documents</SectionLink>} />
      {error ? (
        <SectionError onRetry={retry} />
      ) : !data ? (
        <div role="status" aria-label="Loading documents" className="space-y-px">
          {Array.from({ length: limit }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-none" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <p role="status" className="border bg-white px-4 py-6 text-center text-sm text-muted-foreground">
          No recent documents available.
        </p>
      ) : (
        <ul className="divide-y bg-white ring-1 ring-border">
          {data.data.map((d) => (
            <li key={d.id}>
              <Link
                to={`/documents/${d.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="truncate text-sm font-semibold text-primary">{d.title}</span>
                    {d.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {getCategoryInfo(d.category)?.label ?? d.category} · Updated {formatDate(d.updatedAt)}
                  </span>
                </span>
                <span className="shrink-0 border px-1.5 py-0.5 text-[0.6875rem] font-medium text-foreground/70">{d.fileType}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

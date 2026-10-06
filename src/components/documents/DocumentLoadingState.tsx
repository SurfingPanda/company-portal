import { Skeleton } from '@/components/ui/skeleton'

/** Skeleton rows that mirror the document list. Reusable for any document request. */
export function DocumentLoadingState({ rows = 8 }: { rows?: number }) {
  return (
    <div className="border bg-white" role="status" aria-label="Loading documents" aria-busy="true">
      <span className="sr-only">Loading documents…</span>
      <ul className="divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="size-9 shrink-0 rounded-sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-48 max-w-full rounded-sm" />
              <Skeleton className="h-3 w-72 max-w-full rounded-sm" />
            </div>
            <Skeleton className="hidden h-3.5 w-28 rounded-sm lg:block" />
            <Skeleton className="hidden h-3.5 w-12 rounded-sm md:block" />
            <Skeleton className="hidden h-3.5 w-20 rounded-sm md:block" />
          </li>
        ))}
      </ul>
    </div>
  )
}

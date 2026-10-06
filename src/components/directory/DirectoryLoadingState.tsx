import { Skeleton } from '@/components/ui/skeleton'

interface DirectoryLoadingStateProps {
  rows?: number
}

/** Skeleton rows that mirror the directory list. Reusable while any API request is pending. */
export function DirectoryLoadingState({ rows = 8 }: DirectoryLoadingStateProps) {
  return (
    <div className="border bg-white" role="status" aria-label="Loading employees" aria-busy="true">
      <span className="sr-only">Loading employees…</span>
      <ul className="divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="size-9 shrink-0 rounded-sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40 max-w-full rounded-sm" />
              <Skeleton className="h-3 w-56 max-w-full rounded-sm md:hidden" />
            </div>
            <Skeleton className="hidden h-3.5 w-28 rounded-sm md:block" />
            <Skeleton className="hidden h-3.5 w-36 rounded-sm md:block" />
            <Skeleton className="hidden h-3.5 w-20 rounded-sm lg:block" />
          </li>
        ))}
      </ul>
    </div>
  )
}

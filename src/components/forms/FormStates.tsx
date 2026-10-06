import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Shown when no forms or requests match. */
export function FormEmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h2 className="font-serif text-xl font-semibold text-primary">No forms or requests found</h2>
      <p className="mt-2 text-sm text-muted-foreground">Try changing your search or filters.</p>
      {onClear && (
        <Button variant="outline" className="mt-5 bg-white" onClick={onClear}>
          Clear Filters
        </Button>
      )}
    </div>
  )
}

/** Reusable error state for any load failure. */
export function FormErrorState({ title = 'Unable to load forms', onRetry }: { title?: string; onRetry: () => void }) {
  return (
    <div className="border border-destructive/30 bg-white px-6 py-12 text-center" role="alert">
      <h2 className="font-serif text-xl font-semibold text-primary">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try again later.</p>
      <Button className="mt-5" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

/** Skeleton cards matching the forms grid. */
export function FormLoadingState({ cards = 6 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Loading forms" aria-busy="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Loading forms…</span>
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="border bg-white p-4">
          <div className="flex gap-3">
            <Skeleton className="size-9 shrink-0 rounded-sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24 rounded-sm" />
              <Skeleton className="h-4 w-40 rounded-sm" />
              <Skeleton className="h-3 w-full rounded-sm" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <Skeleton className="h-3 w-24 rounded-sm" />
            <Skeleton className="h-8 w-28 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Skeleton rows matching the requests list. */
export function RequestListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading requests" aria-busy="true" className="border bg-white">
      <span className="sr-only">Loading requests…</span>
      <ul className="divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-3.5 w-28 rounded-sm" />
            <Skeleton className="h-3.5 flex-1 rounded-sm" />
            <Skeleton className="hidden h-3.5 w-24 rounded-sm md:block" />
            <Skeleton className="h-6 w-24 rounded-sm" />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Skeleton for the request detail page. */
export function RequestDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading request" className="space-y-6">
      <Skeleton className="h-28 rounded-sm" />
      <div className="grid gap-10 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-sm lg:col-span-2" />
        <Skeleton className="h-64 rounded-sm" />
      </div>
    </div>
  )
}

/** Reminder that forms and requests are development samples. */
export function SampleFormsNotice({ className }: { className?: string }) {
  return (
    <div role="note" className={cn('flex items-start gap-3 border border-dashed border-muted-foreground/40 bg-white px-4 py-3 text-sm', className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-foreground/80">
        <span className="font-semibold text-foreground">Sample forms and requests.</span> These are development examples, not
        official Eljin Corporation forms or processes. Submitting a request does not send it anywhere yet.
      </p>
    </div>
  )
}

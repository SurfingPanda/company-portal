import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function AnnouncementEmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h2 className="font-serif text-xl font-semibold text-primary">No announcements found</h2>
      <p className="mt-2 text-sm text-muted-foreground">Try changing your search or filters.</p>
      {onClear && (
        <Button variant="outline" className="mt-5 bg-white" onClick={onClear}>
          Clear Filters
        </Button>
      )}
    </div>
  )
}

/** Friendly error. Raw API errors are never shown to employees. */
export function AnnouncementErrorState({ title = "We couldn't load announcements.", onRetry }: { title?: string; onRetry: () => void }) {
  return (
    <div className="border border-destructive/30 bg-white px-6 py-12 text-center" role="alert">
      <h2 className="font-serif text-xl font-semibold text-primary">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
      <Button className="mt-5" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

export function AnnouncementLoadingState({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading announcements" aria-busy="true" className="divide-y border bg-white">
      <span className="sr-only">Loading announcements…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2 px-4 py-4">
          <Skeleton className="h-3 w-24 rounded-sm" />
          <Skeleton className="h-5 w-72 max-w-full rounded-sm" />
          <Skeleton className="h-3 w-full max-w-lg rounded-sm" />
        </div>
      ))}
    </div>
  )
}

export function SampleAnnouncementsNotice({ className }: { className?: string }) {
  return (
    <div role="note" className={cn('flex items-start gap-3 border border-dashed border-muted-foreground/40 bg-white px-4 py-3 text-sm', className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-foreground/80">
        <span className="font-semibold text-foreground">Sample announcements.</span> These are fictional development examples, not
        official Eljin Corporation communications.
      </p>
    </div>
  )
}

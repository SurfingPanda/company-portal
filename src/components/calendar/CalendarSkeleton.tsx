import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder shaped like the month grid (md+) or the event list (small screens). */
export function CalendarSkeleton() {
  return (
    <div role="status" aria-label="Loading calendar" aria-busy="true">
      <span className="sr-only">Loading calendar…</span>
      <div className="hidden grid-cols-7 gap-px border bg-border md:grid">
        {Array.from({ length: 35 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-none bg-white" />
        ))}
      </div>
      <div className="space-y-px md:hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-none" />
        ))}
      </div>
    </div>
  )
}

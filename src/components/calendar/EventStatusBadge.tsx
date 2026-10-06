import { eventStatusLabels } from '@/data/eventCategories'
import { cn } from '@/lib/utils'
import type { EventStatus } from '@/types/event'

/** Quiet status text. "Scheduled" is the default and is not shown unless `showScheduled` is set. */
export function EventStatusBadge({ status = 'scheduled', showScheduled = false, className }: { status?: EventStatus; showScheduled?: boolean; className?: string }) {
  if (status === 'scheduled' && !showScheduled) return null
  return (
    <span
      className={cn(
        'inline-block border px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider',
        status === 'cancelled' && 'border-destructive/40 text-destructive',
        status === 'postponed' && 'border-amber-600/50 text-amber-700',
        (status === 'completed' || status === 'scheduled') && 'text-muted-foreground',
        className,
      )}
    >
      {eventStatusLabels[status]}
    </span>
  )
}

import { eventCategoryMeta } from '@/components/calendar/eventCategoryMeta'
import { getEventCategoryLabel } from '@/data/eventCategories'
import { cn } from '@/lib/utils'
import type { EventCategory } from '@/types/event'

/** Muted badge with icon + text, so category is never conveyed by colour alone. */
export function EventCategoryBadge({ category, className }: { category: EventCategory; className?: string }) {
  const { icon: Icon } = eventCategoryMeta[category]
  return (
    <span className={cn('inline-flex items-center gap-1 border bg-secondary px-1.5 py-0.5 text-[0.6875rem] font-medium text-foreground/80', className)}>
      <Icon className="size-3" aria-hidden="true" />
      {getEventCategoryLabel(category)}
    </span>
  )
}

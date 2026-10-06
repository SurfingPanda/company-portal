import { Link } from 'react-router-dom'
import { SectionHeading } from '@/components/common/SectionHeading'
import { EventCategoryBadge } from '@/components/calendar/EventCategoryBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEventDate } from '@/lib/calendar'
import type { CalendarEvent } from '@/types/event'

/** Upcoming holidays and deadlines (sample data only). */
export function ImportantDates({ events }: { events: CalendarEvent[] | undefined }) {
  return (
    <section aria-labelledby="important-dates-heading">
      <SectionHeading id="important-dates-heading" title="Important Dates" />
      {!events ? (
        <div role="status" aria-label="Loading important dates" className="space-y-px">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-none" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="border bg-white px-4 py-6 text-center text-sm text-muted-foreground">No important dates ahead.</p>
      ) : (
        <ul className="bg-white ring-1 ring-border">
          {events.map((event) => (
            <li key={event.id} className="border-b border-border last:border-b-0">
              <Link
                to={`/calendar/${event.id}`}
                className="block px-4 py-2.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <span className="block text-sm font-medium text-primary">{event.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">{formatEventDate(event)}</span>
                  <EventCategoryBadge category={event.category} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

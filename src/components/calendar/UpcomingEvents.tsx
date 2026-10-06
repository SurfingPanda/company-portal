import { MapPin, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionHeading, SectionLink } from '@/components/common/SectionHeading'
import { EventCategoryBadge } from '@/components/calendar/EventCategoryBadge'
import { EventStatusBadge } from '@/components/calendar/EventStatusBadge'
import { eventTimeLabel, parseISODate } from '@/lib/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/event'

interface UpcomingEventsProps {
  /** Undefined while loading. */
  events: CalendarEvent[] | undefined
  /** Optional section number used by the home page headings. */
  number?: string
  headingId?: string
}

/** Compact upcoming-events list shared by the Home page and the Calendar page. */
export function UpcomingEvents({ events, number, headingId = 'upcoming-events-heading' }: UpcomingEventsProps) {
  return (
    <section id="events" aria-labelledby={headingId} className="scroll-mt-20">
      <SectionHeading id={headingId} number={number} title="Upcoming Events" action={<SectionLink href="/calendar">Calendar</SectionLink>} />
      {!events ? (
        <div role="status" aria-label="Loading upcoming events" className="space-y-px">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-none" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="border bg-white px-4 py-6 text-center text-sm text-muted-foreground">No upcoming events.</p>
      ) : (
        <ol className="bg-white ring-1 ring-border">
          {events.map((event) => {
            const date = parseISODate(event.startDate)
            const online = event.location?.toLowerCase() === 'online'
            return (
              <li key={event.id} className="border-b border-border last:border-b-0">
                <Link
                  to={`/calendar/${event.id}`}
                  className="group flex items-stretch transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <div aria-hidden="true" className="flex w-16 shrink-0 flex-col items-center justify-center bg-primary py-3 leading-none text-primary-foreground group-hover:bg-navy-deep">
                    <span className="text-[0.625rem] font-semibold tracking-[0.2em] text-[#6fdc7a]">
                      {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="mt-1 font-serif text-2xl font-medium tabular-nums">{date.getDate()}</span>
                  </div>
                  <div className="min-w-0 px-4 py-3">
                    <h3 className={cn('text-[0.9375rem] font-semibold text-foreground group-hover:text-primary', event.status === 'cancelled' && 'line-through')}>
                      {event.title}
                    </h3>
                    <span className="sr-only">{parseISODate(event.startDate).toDateString()}</span>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <EventCategoryBadge category={event.category} />
                      <EventStatusBadge status={event.status} />
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span className="tabular-nums">{eventTimeLabel(event)}</span>
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          {online ? <Video className="size-3" aria-hidden="true" /> : <MapPin className="size-3" aria-hidden="true" />}
                          {online ? 'Online' : event.location}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

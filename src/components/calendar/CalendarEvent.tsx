import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EventCategoryBadge } from '@/components/calendar/EventCategoryBadge'
import { eventCategoryMeta } from '@/components/calendar/eventCategoryMeta'
import { EventStatusBadge } from '@/components/calendar/EventStatusBadge'
import { eventTimeLabel, formatTime, isAllDay } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/event'

const eventHref = (event: CalendarEvent) => `/calendar/${event.id}`

/** Compact event for month-view cells: category icon, time (or all-day fill) and title. */
export function CalendarEventChip({ event }: { event: CalendarEvent }) {
  const { icon: Icon, border } = eventCategoryMeta[event.category]
  const allDay = isAllDay(event)
  const cancelled = event.status === 'cancelled'

  return (
    <Link
      to={eventHref(event)}
      title={`${event.title} · ${eventTimeLabel(event)}${event.status && event.status !== 'scheduled' ? ` · ${event.status}` : ''}`}
      className={cn(
        'flex items-center gap-1 truncate border-l-2 px-1 py-0.5 text-[0.6875rem] leading-tight hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        border,
        allDay ? 'bg-secondary font-medium' : 'bg-white',
        cancelled && 'text-muted-foreground line-through',
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {!allDay && <span className="shrink-0 tabular-nums text-muted-foreground">{formatTime(event.startTime!).replace(':00', '').replace(' ', '').toLowerCase()}</span>}
      <span className="truncate">{event.title}</span>
      <span className="sr-only">
        {allDay ? 'All day' : eventTimeLabel(event)}
        {event.status && event.status !== 'scheduled' ? `, ${event.status}` : ''}
      </span>
    </Link>
  )
}

/** Full event row used in lists, the week view and the selected-day panel. */
export function CalendarEventRow({ event }: { event: CalendarEvent }) {
  const { border } = eventCategoryMeta[event.category]
  const cancelled = event.status === 'cancelled'

  return (
    <Link
      to={eventHref(event)}
      className={cn(
        'block border-l-[3px] bg-white px-3 py-2.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        border,
      )}
    >
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn('text-sm font-semibold text-primary', cancelled && 'text-muted-foreground line-through')}>{event.title}</span>
        <EventStatusBadge status={event.status} />
      </span>
      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span className="tabular-nums">{eventTimeLabel(event)}</span>
        {event.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden="true" />
            {event.location}
          </span>
        )}
        {event.department && <span>{event.department}</span>}
      </span>
      <EventCategoryBadge category={event.category} className="mt-1.5" />
    </Link>
  )
}

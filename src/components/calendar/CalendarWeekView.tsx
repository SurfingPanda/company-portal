import { CalendarEventRow } from '@/components/calendar/CalendarEvent'
import { eventOccursOn, getWeekDays, parseISODate, weekdayShort } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/event'

interface CalendarWeekViewProps {
  anchor: string
  today: string
  events: CalendarEvent[]
  busy?: boolean
}

/** Seven day columns on wide screens; stacked days on small screens. */
export function CalendarWeekView({ anchor, today, events, busy }: CalendarWeekViewProps) {
  const days = getWeekDays(anchor)

  return (
    <ol className={cn('grid gap-px border bg-border transition-opacity lg:grid-cols-7', busy && 'opacity-60')} aria-busy={busy} aria-label="Week calendar">
      {days.map((iso) => {
        const date = parseISODate(iso)
        const dayEvents = events.filter((e) => eventOccursOn(e, iso))
        const isToday = iso === today
        return (
          <li key={iso} className="min-w-0 bg-white">
            <h3 className={cn('flex items-center gap-2 border-b px-3 py-2 text-xs font-semibold uppercase tracking-widest', isToday ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>
              <span>{weekdayShort[date.getDay()]}</span>
              <span className="tabular-nums">{date.getDate()}</span>
              {isToday && <span className="font-medium normal-case tracking-normal">Today</span>}
            </h3>
            {dayEvents.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground">No events</p>
            ) : (
              <ul className="divide-y">
                {dayEvents.map((e) => (
                  <li key={e.id}>
                    <CalendarEventRow event={e} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}

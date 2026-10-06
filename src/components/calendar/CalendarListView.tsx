import { CalendarEventRow } from '@/components/calendar/CalendarEvent'
import { eventOccursOn, formatFullDate, formatMonthYear, getMonthGrid, isSameMonth, parseISODate } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/event'

interface CalendarListViewProps {
  anchor: string
  today: string
  events: CalendarEvent[]
  busy?: boolean
}

/** Events for the month grouped by date, with simple dividers. A multi-day event appears under each of its days. */
export function CalendarListView({ anchor, today, events, busy }: CalendarListViewProps) {
  const monthDays = getMonthGrid(anchor).filter((iso) => isSameMonth(iso, anchor))
  const groups = monthDays
    .map((iso) => ({ iso, items: events.filter((e) => eventOccursOn(e, iso)) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className={cn('transition-opacity', busy && 'opacity-60')} aria-busy={busy}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{formatMonthYear(anchor)}</p>
      <ol className="border-t">
        {groups.map(({ iso, items }) => {
          const date = parseISODate(iso)
          const isToday = iso === today
          return (
            <li key={iso} className="grid gap-2 border-b py-3 sm:grid-cols-[7rem_1fr] sm:gap-5">
              <div className="flex items-baseline gap-2 sm:block">
                <p className={cn('font-serif text-lg font-semibold tabular-nums', isToday ? 'text-gold' : 'text-primary')}>
                  <time dateTime={iso}>
                    {date.toLocaleDateString('en-US', { month: 'short' })} {String(date.getDate()).padStart(2, '0')}
                  </time>
                </p>
                <p className="text-xs text-muted-foreground">{isToday ? 'Today' : formatFullDate(iso).split(',')[0]}</p>
              </div>
              <ul className="divide-y border">
                {items.map((e) => (
                  <li key={e.id}>
                    <CalendarEventRow event={e} />
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

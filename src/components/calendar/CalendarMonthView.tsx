import { CalendarEventChip, CalendarEventRow } from '@/components/calendar/CalendarEvent'
import { eventCategoryMeta } from '@/components/calendar/eventCategoryMeta'
import { eventOccursOn, formatFullDate, getMonthGrid, isSameMonth, parseISODate, weekdayShort } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/event'

interface CalendarMonthViewProps {
  anchor: string
  today: string
  events: CalendarEvent[]
  selectedDate: string
  onSelectDate: (iso: string) => void
  busy?: boolean
}

const MAX_CHIPS = 3

/** Month grid plus a panel listing the selected day's events (works for keyboard, touch and small screens). */
export function CalendarMonthView({ anchor, today, events, selectedDate, onSelectDate, busy }: CalendarMonthViewProps) {
  const days = getMonthGrid(anchor)
  const weeks = Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7))
  const selectedEvents = events.filter((e) => eventOccursOn(e, selectedDate))

  return (
    <div className={cn('transition-opacity', busy && 'opacity-60')} aria-busy={busy}>
      <table className="w-full table-fixed border-collapse border bg-white" aria-label="Month calendar">
        <thead>
          <tr>
            {weekdayShort.map((day) => (
              <th key={day} scope="col" className="border-b bg-secondary py-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((iso) => {
                const dayEvents = events.filter((e) => eventOccursOn(e, iso))
                const inMonth = isSameMonth(iso, anchor)
                const isToday = iso === today
                const isSelected = iso === selectedDate
                const extra = dayEvents.length - MAX_CHIPS

                return (
                  <td
                    key={iso}
                    className={cn(
                      'h-16 border align-top md:h-28',
                      !inMonth && 'bg-secondary/50',
                      isSelected && 'outline outline-2 -outline-offset-2 outline-primary',
                    )}
                  >
                    <div className="flex h-full flex-col gap-1 p-1">
                      <button
                        type="button"
                        onClick={() => onSelectDate(iso)}
                        aria-label={`${formatFullDate(iso)}, ${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}`}
                        aria-current={isToday ? 'date' : undefined}
                        aria-pressed={isSelected}
                        className={cn(
                          'flex size-6 items-center justify-center self-start text-xs tabular-nums hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
                          inMonth ? 'font-medium text-foreground' : 'text-muted-foreground/60',
                          isToday && 'bg-primary font-semibold text-primary-foreground hover:bg-primary',
                        )}
                      >
                        {parseISODate(iso).getDate()}
                      </button>

                      {/* Small screens: markers only; details appear in the selected-day panel. */}
                      <div className="flex flex-wrap gap-0.5 px-0.5 md:hidden" aria-hidden="true">
                        {dayEvents.slice(0, 4).map((e) => (
                          <span key={e.id} className={cn('size-1.5 rounded-full', eventCategoryMeta[e.category].dot)} />
                        ))}
                      </div>

                      {/* Larger screens: limited previews. */}
                      <div className="hidden min-h-0 flex-1 flex-col gap-0.5 overflow-hidden md:flex">
                        {dayEvents.slice(0, extra > 0 ? MAX_CHIPS - 1 : MAX_CHIPS).map((e) => (
                          <CalendarEventChip key={e.id} event={e} />
                        ))}
                        {extra > 0 && (
                          <button
                            type="button"
                            onClick={() => onSelectDate(iso)}
                            className="self-start px-1 text-[0.6875rem] font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                          >
                            +{extra + 1} more
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <section aria-labelledby="selected-day-heading" className="mt-4">
        <h3 id="selected-day-heading" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">
          {formatFullDate(selectedDate)}
        </h3>
        {selectedEvents.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No events on this day.</p>
        ) : (
          <ul className="divide-y border-x border-b">
            {selectedEvents.map((e) => (
              <li key={e.id}>
                <CalendarEventRow event={e} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { CalendarListView } from '@/components/calendar/CalendarListView'
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView'
import { CalendarSkeleton } from '@/components/calendar/CalendarSkeleton'
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar'
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView'
import { EventEmptyState } from '@/components/calendar/EventEmptyState'
import { EventErrorState } from '@/components/calendar/EventErrorState'
import { EventFilters } from '@/components/calendar/EventFilters'
import { ImportantDates } from '@/components/calendar/ImportantDates'
import { SampleEventsNotice } from '@/components/calendar/SampleEventsNotice'
import { UpcomingEvents } from '@/components/calendar/UpcomingEvents'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAsync } from '@/hooks/useAsync'
import { useCalendarBrowser } from '@/hooks/useCalendarBrowser'
import { isSameMonth } from '@/lib/calendar'
import { getImportantDates, getUpcomingEvents } from '@/services/eventService'

export default function CalendarPage() {
  const calendar = useCalendarBrowser()
  const { today, view, anchor, events, error, loading, retry, hasFilters, clearFilters } = calendar

  const { data: upcoming } = useAsync(() => getUpcomingEvents(5), [])
  const { data: important } = useAsync(() => getImportantDates(6), [])

  // Selected day for the month view. Follows the visible month; defaults to today when it is visible.
  const [selectedDate, setSelectedDate] = useState(anchor)
  useEffect(() => {
    setSelectedDate(isSameMonth(anchor, today) ? today : anchor)
  }, [anchor, today])

  let body
  if (error) {
    body = <EventErrorState onRetry={retry} />
  } else if (!events) {
    body = <CalendarSkeleton />
  } else if (events.length === 0 && view !== 'month') {
    body = <EventEmptyState onClear={hasFilters ? clearFilters : undefined} />
  } else if (view === 'month') {
    body = (
      <>
        <CalendarMonthView anchor={anchor} today={today} events={events} selectedDate={selectedDate} onSelectDate={setSelectedDate} busy={loading} />
        {events.length === 0 && hasFilters && <div className="mt-4"><EventEmptyState onClear={clearFilters} /></div>}
      </>
    )
  } else if (view === 'week') {
    body = <CalendarWeekView anchor={anchor} today={today} events={events} busy={loading} />
  } else {
    body = <CalendarListView anchor={anchor} today={today} events={events} busy={loading} />
  }

  return (
    <PageContainer className="pb-16">
      <PageHeader
        title="Company Calendar"
        description="View upcoming company activities, events, training, holidays, and important dates."
        breadcrumbs={[{ label: 'Calendar' }]}
      />
      <SampleEventsNotice className="mt-6" />

      <div className="mt-6 border bg-white p-4 sm:p-5">
        <EventFilters
          search={calendar.searchInput}
          onSearchChange={calendar.setSearchInput}
          category={calendar.category}
          department={calendar.department}
          onCategoryChange={calendar.setCategory}
          onDepartmentChange={calendar.setDepartment}
        />
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="mt-3 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
            Clear Filters
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Calendar" className="min-w-0 space-y-4">
          <CalendarToolbar
            title={calendar.title}
            view={view}
            onViewChange={calendar.setView}
            onPrevious={calendar.goPrevious}
            onNext={calendar.goNext}
            onToday={calendar.goToday}
          />
          {body}
        </section>

        <aside className="space-y-10">
          <UpcomingEvents events={upcoming} />
          <ImportantDates events={important} />
        </aside>
      </div>
    </PageContainer>
  )
}

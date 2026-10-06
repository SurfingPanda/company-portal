import { SectionHeading } from '@/components/common/SectionHeading'
import { UpcomingEvents } from '@/components/calendar/UpcomingEvents'
import { SectionError } from '@/components/dashboard/SectionBoundary'
import { useAsync } from '@/hooks/useAsync'
import { getUpcomingEvents } from '@/services/eventService'

/** Upcoming events from the same calendar data as the Calendar page, with a section-level error state. */
export function DashboardEvents() {
  const { data, error, retry } = useAsync(() => getUpcomingEvents(4), [])

  if (error) {
    return (
      <section aria-labelledby="events-heading">
        <SectionHeading id="events-heading" title="Upcoming Events" />
        <SectionError onRetry={retry} />
      </section>
    )
  }
  return <UpcomingEvents events={data} headingId="events-heading" />
}

import { ArrowLeft, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EventCategoryBadge } from '@/components/calendar/EventCategoryBadge'
import { EventErrorState } from '@/components/calendar/EventErrorState'
import { EventStatusBadge } from '@/components/calendar/EventStatusBadge'
import { SampleEventsNotice } from '@/components/calendar/SampleEventsNotice'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { eventStatusLabels, eventVisibilityLabels, getEventCategoryLabel } from '@/data/eventCategories'
import { useAsync } from '@/hooks/useAsync'
import { eventTimeLabel, formatEventDate } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import { getEvent } from '@/services/eventService'
import type { CalendarEvent } from '@/types/event'

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading event" className="space-y-6">
      <Skeleton className="h-28 rounded-sm" />
      <Skeleton className="h-48 rounded-sm" />
    </div>
  )
}

function EventNotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Event Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The event you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/calendar">
          <ArrowLeft aria-hidden="true" /> Back to Calendar
        </Link>
      </Button>
    </div>
  )
}

function EventDetail({ event }: { event: CalendarEvent }) {
  const cancelled = event.status === 'cancelled'
  const info: { label: string; value: string }[] = [
    { label: 'Date', value: formatEventDate(event) },
    { label: 'Time', value: eventTimeLabel(event) },
    { label: 'Location', value: event.location ?? 'To be confirmed' },
    { label: 'Category', value: getEventCategoryLabel(event.category) },
    { label: 'Department', value: event.department ?? 'All Departments' },
    { label: 'Status', value: eventStatusLabels[event.status ?? 'scheduled'] },
    { label: 'Visibility', value: eventVisibilityLabels[event.visibility ?? 'all'] },
  ]

  return (
    <div className="space-y-8">
      <header className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <EventCategoryBadge category={event.category} />
          <EventStatusBadge status={event.status} />
          {event.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </div>
        <h1 className={cn('mt-3 font-serif text-3xl font-semibold tracking-tight text-primary', cancelled && 'text-muted-foreground line-through')}>
          {event.title}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/80">
          <span>{formatEventDate(event)}</span>
          <span className="tabular-nums">{eventTimeLabel(event)}</span>
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {event.location}
            </span>
          )}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section aria-labelledby="event-description-heading">
            <h2 id="event-description-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
              Description
            </h2>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-foreground/85">{event.description}</p>
          </section>

          <section aria-labelledby="event-organizer-heading">
            <h2 id="event-organizer-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
              Organizer
            </h2>
            <p className={cn('mt-3 text-sm', !event.organizer && 'italic text-muted-foreground')}>{event.organizer ?? 'Organizer to be confirmed.'}</p>
          </section>

          <SampleEventsNotice />
          <Button asChild variant="outline" className="bg-white">
            <Link to="/calendar">
              <ArrowLeft aria-hidden="true" /> Back to Calendar
            </Link>
          </Button>
        </div>

        <section aria-labelledby="event-info-heading">
          <h2 id="event-info-heading" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
            Event Information
          </h2>
          <dl>
            {info.map((item) => (
              <div key={item.label} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-border py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
                <dd className="text-sm text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}

export default function EventDetailPage() {
  const { eventId = '' } = useParams()
  const { data: event, error, loading, retry } = useAsync(() => getEvent(eventId), [eventId])

  const trail = [{ label: 'Calendar', href: '/calendar' }, { label: event ? event.title : loading ? 'Loading…' : 'Not found' }]

  let content
  if (error) content = <EventErrorState title="Unable to load this event" onRetry={retry} />
  else if (loading && !event) content = <DetailSkeleton />
  else if (!event) content = <EventNotFound />
  else content = <EventDetail event={event} />

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {content}
    </PageContainer>
  )
}

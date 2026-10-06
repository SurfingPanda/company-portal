import { toISODate } from '@/lib/calendar'
import { api } from '@/services/api'
import type { ApiPage } from '@/services/adapters/paginate'
import type { ApiResponse } from '@/types/api'
import type { CalendarEvent, EventCategory, EventQuery, EventStatus, EventVisibility } from '@/types/event'

/**
 * Calendar, Laravel adapter: GET /api/calendar/events[/{id}]. Times are shown in Philippine time (the portal's company
 * timezone) whatever the browser's timezone is. Laravel only returns events open to everyone to ordinary employees.
 */
interface ApiEvent {
  id: number
  title: string
  description: string | null
  category: EventCategory
  status: EventStatus
  visibility: EventVisibility
  location: string | null
  starts_at: string
  ends_at: string | null
  is_all_day: boolean
  is_sample?: boolean
}

const parts = (iso: string) => {
  const formatted = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso))
  const get = (type: string) => formatted.find((p) => p.type === type)?.value ?? '00'
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` }
}

const toEvent = (e: ApiEvent): CalendarEvent => {
  const start = parts(e.starts_at)
  const end = e.ends_at ? parts(e.ends_at) : undefined
  return {
    id: String(e.id),
    title: e.title,
    description: e.description ?? '',
    startDate: start.date,
    endDate: end && end.date !== start.date ? end.date : undefined,
    startTime: e.is_all_day ? undefined : start.time,
    endTime: e.is_all_day || !end ? undefined : end.time,
    category: e.category,
    location: e.location ?? undefined,
    isAllDay: e.is_all_day,
    status: e.status,
    visibility: e.visibility,
    isSample: e.is_sample,
  }
}

const list = async (params: Record<string, string | number | undefined>) =>
  (await api.get<ApiPage<ApiEvent>>('/api/calendar/events', { sort: 'starts_at', direction: 'asc', per_page: 100, ...params })).data.map(toEvent)

export const getEvents = (query: EventQuery = {}): Promise<CalendarEvent[]> =>
  list({ search: query.search?.trim(), category: query.category, from: query.from, to: query.to })

export async function getEvent(id: string): Promise<CalendarEvent | null> {
  try {
    return toEvent((await api.get<ApiResponse<ApiEvent>>(`/api/calendar/events/${encodeURIComponent(id)}`)).data)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

export async function getUpcomingEvents(limit = 5): Promise<CalendarEvent[]> {
  return (await list({ from: toISODate(new Date()), status: 'scheduled', per_page: limit }))
}

export async function getImportantDates(limit = 6): Promise<CalendarEvent[]> {
  const upcoming = await list({ from: toISODate(new Date()) })
  return upcoming.filter((e) => (e.category === 'holiday' || e.category === 'deadline') && e.status !== 'cancelled').slice(0, limit)
}

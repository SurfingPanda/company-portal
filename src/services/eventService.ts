import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/events.api'
import { departmentOptions } from '@/data/directoryOptions'
import { eventCategories, getEventCategoryLabel } from '@/data/eventCategories'
import { events } from '@/data/events'
import { compareEvents, eventEnd, toISODate } from '@/lib/calendar'
import type { CalendarEvent, EventCategoryInfo, EventQuery } from '@/types/event'

/**
 * Service layer for calendar events.
 * Each function maps to a future Laravel endpoint; replace the body with a `fetch` call that
 * returns the same shape and no component needs to change.
 */

const MOCK_LATENCY_MS = 200
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

function matchesSearch(event: CalendarEvent, search: string) {
  const haystack = [event.title, event.description, event.department, getEventCategoryLabel(event.category), event.location]
    .join(' ')
    .toLowerCase()
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

/** GET /api/events */
async function mockGetEvents(query: EventQuery = {}): Promise<CalendarEvent[]> {
  await wait()
  const { search, category, department, from, to } = query
  return events
    .filter((e) => (search?.trim() ? matchesSearch(e, search) : true))
    .filter((e) => (category ? e.category === category : true))
    .filter((e) => (department ? e.department === department : true))
    .filter((e) => (from ? eventEnd(e) >= from : true))
    .filter((e) => (to ? e.startDate <= to : true))
    .sort(compareEvents)
}

/** GET /api/events/{id} */
async function mockGetEvent(id: string): Promise<CalendarEvent | null> {
  await wait()
  return events.find((e) => e.id === id) ?? null
}

/** GET /api/events/upcoming */
async function mockGetUpcomingEvents(limit = 5): Promise<CalendarEvent[]> {
  await wait()
  const today = toISODate(new Date())
  return events
    .filter((e) => eventEnd(e) >= today && (e.status === 'scheduled' || e.status === 'postponed'))
    .sort(compareEvents)
    .slice(0, limit)
}

/** Holidays and deadlines still ahead, for the "Important Dates" section. */
async function mockGetImportantDates(limit = 6): Promise<CalendarEvent[]> {
  await wait()
  const today = toISODate(new Date())
  return events
    .filter((e) => (e.category === 'holiday' || e.category === 'deadline') && eventEnd(e) >= today && e.status !== 'cancelled')
    .sort(compareEvents)
    .slice(0, limit)
}

/** GET /api/events/categories */
export async function getEventCategories(): Promise<EventCategoryInfo[]> {
  await wait()
  return eventCategories
}

/** GET /api/events/departments (shared with the Employee Directory) */
export async function getEventDepartments(): Promise<string[]> {
  await wait()
  return departmentOptions
}

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getEvents: typeof mockGetEvents = isApiMode ? apiAdapter.getEvents : mockGetEvents
export const getEvent: typeof mockGetEvent = isApiMode ? apiAdapter.getEvent : mockGetEvent
export const getUpcomingEvents: typeof mockGetUpcomingEvents = isApiMode ? apiAdapter.getUpcomingEvents : mockGetUpcomingEvents
export const getImportantDates: typeof mockGetImportantDates = isApiMode ? apiAdapter.getImportantDates : mockGetImportantDates

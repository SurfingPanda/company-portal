import type { CalendarEvent } from '@/types/event'

/** Calendar date helpers. Dates are ISO strings (YYYY-MM-DD) so there are no timezone shifts. */

const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const parseISODate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const isValidISODate = (value: string | null): value is string =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseISODate(value).getTime()))

export function addDays(iso: string, days: number) {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** First day of the month containing `iso`, shifted by `months`. */
export function addMonths(iso: string, months: number) {
  const date = parseISODate(iso)
  return toISODate(new Date(date.getFullYear(), date.getMonth() + months, 1))
}

export const startOfMonth = (iso: string) => `${iso.slice(0, 7)}-01`

export function endOfMonth(iso: string) {
  const date = parseISODate(iso)
  return toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

/** Sunday on or before the date. */
export function startOfWeek(iso: string) {
  const date = parseISODate(iso)
  return addDays(iso, -date.getDay())
}

export const getWeekDays = (anchor: string) => {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** Six full weeks covering the month, so the grid height stays constant. */
export function getMonthGrid(anchor: string) {
  const start = startOfWeek(startOfMonth(anchor))
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

export const isSameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7)

export const eventEnd = (event: CalendarEvent) => event.endDate ?? event.startDate

export const eventOccursOn = (event: CalendarEvent, iso: string) => event.startDate <= iso && eventEnd(event) >= iso

export const isAllDay = (event: CalendarEvent) => Boolean(event.isAllDay) || !event.startTime

/** All-day events first, then by start time, then title. */
export function compareEvents(a: CalendarEvent, b: CalendarEvent) {
  return (
    a.startDate.localeCompare(b.startDate) ||
    Number(isAllDay(b)) - Number(isAllDay(a)) ||
    (a.startTime ?? '').localeCompare(b.startTime ?? '') ||
    a.title.localeCompare(b.title)
  )
}

/** "09:00" -> "9:00 AM" */
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${pad(m)} ${suffix}`
}

export function eventTimeLabel(event: CalendarEvent) {
  if (isAllDay(event)) return 'All Day'
  return event.endTime ? `${formatTime(event.startTime!)} – ${formatTime(event.endTime)}` : formatTime(event.startTime!)
}

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const longDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const fullDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

export const formatMonthYear = (iso: string) => monthYear.format(parseISODate(iso))
export const formatFullDate = (iso: string) => fullDate.format(parseISODate(iso))
export const formatShortMonthDay = (iso: string) => monthDay.format(parseISODate(iso))

/** "September 15, 2026" or "October 19 – October 23, 2026" for multi-day events. */
export function formatEventDate(event: CalendarEvent) {
  const end = event.endDate
  if (!end || end === event.startDate) return longDate.format(parseISODate(event.startDate))
  return `${longDate.format(parseISODate(event.startDate))} – ${longDate.format(parseISODate(end))}`
}

/** Title for the visible range, e.g. "October 2026" or "Sep 27 – Oct 3, 2026". */
export function formatWeekRange(anchor: string) {
  const days = getWeekDays(anchor)
  const start = parseISODate(days[0])
  const end = parseISODate(days[6])
  return `${monthDay.format(start)} – ${monthDay.format(end)}, ${end.getFullYear()}`
}

export const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export type EventCategory =
  | 'company-event'
  | 'training'
  | 'meeting'
  | 'holiday'
  | 'deadline'
  | 'employee-activity'
  | 'department-event'
  | 'other'

export type EventStatus = 'scheduled' | 'cancelled' | 'postponed' | 'completed'

/** Who may see an event. Only stored for now; enforcement belongs to the backend phase. */
export type EventVisibility = 'all' | 'department' | 'private'

/** Reserved for future recurring events. No recurrence engine exists: each event is one record. */
export interface EventRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval?: number
  /** ISO date (YYYY-MM-DD). */
  until?: string
}

/**
 * A calendar event. Shaped to match a future Laravel `events` resource, including the fields an
 * admin module will need (status, visibility, category, department, recurrence).
 * Dates are ISO `YYYY-MM-DD`; times are 24-hour `HH:mm`.
 */
export interface CalendarEvent {
  id: string
  title: string
  description: string
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  category: EventCategory
  department?: string
  location?: string
  isAllDay?: boolean
  organizer?: string
  status?: EventStatus
  visibility?: EventVisibility
  recurrence?: EventRecurrence
  /** True for development sample records that are not real company events. */
  isSample?: boolean
}

export interface EventCategoryInfo {
  id: EventCategory
  label: string
}

/** Query parameters that map to a future `GET /api/events` request. */
export interface EventQuery {
  search?: string
  category?: EventCategory
  department?: string
  /** Inclusive range (ISO dates). Events overlapping the range are returned. */
  from?: string
  to?: string
}

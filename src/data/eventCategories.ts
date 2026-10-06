import type { EventCategoryInfo, EventStatus, EventVisibility } from '@/types/event'

/** Event categories. Will come from `GET /api/events/categories` later. */
export const eventCategories: EventCategoryInfo[] = [
  { id: 'company-event', label: 'Company Event' },
  { id: 'training', label: 'Training' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'holiday', label: 'Holiday' },
  { id: 'deadline', label: 'Deadline' },
  { id: 'employee-activity', label: 'Employee Activity' },
  { id: 'department-event', label: 'Department Event' },
  { id: 'other', label: 'Other' },
]

export const eventStatusLabels: Record<EventStatus, string> = {
  scheduled: 'Scheduled',
  cancelled: 'Cancelled',
  postponed: 'Postponed',
  completed: 'Completed',
}

export const eventVisibilityLabels: Record<EventVisibility, string> = {
  all: 'All Employees',
  department: 'Department',
  private: 'Private',
}

export const getEventCategoryLabel = (id: string) => eventCategories.find((c) => c.id === id)?.label ?? id

import type { AnnouncementCategory, AnnouncementDateRange, AnnouncementPriority, AnnouncementSort } from '@/types/announcement'

/**
 * Sample category set. These are not confirmed Eljin organizational categories; they will be
 * configured by the backend later (`GET /api/announcements/categories`).
 */
export const announcementCategories: { id: AnnouncementCategory; label: string }[] = [
  { id: 'company-news', label: 'Company News' },
  { id: 'hr', label: 'HR & Employee' },
  { id: 'it', label: 'IT & Systems' },
  { id: 'operations', label: 'Operations' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'finance', label: 'Finance' },
  { id: 'training', label: 'Training' },
  { id: 'safety', label: 'Safety' },
  { id: 'policy', label: 'Policy & Compliance' },
  { id: 'other', label: 'Other' },
]

export const getAnnouncementCategoryLabel = (id: string) => announcementCategories.find((c) => c.id === id)?.label ?? id

export const priorityLabels: Record<AnnouncementPriority, string> = {
  normal: 'Normal',
  important: 'Important',
  urgent: 'Urgent',
}

export const announcementSortOptions: { value: AnnouncementSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'Title A–Z' },
  { value: 'za', label: 'Title Z–A' },
]

export const dateRangeOptions: { value: AnnouncementDateRange; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export const ANNOUNCEMENT_PAGE_SIZE = 10

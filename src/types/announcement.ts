export type AnnouncementCategory =
  | 'company-news'
  | 'hr'
  | 'it'
  | 'operations'
  | 'facilities'
  | 'finance'
  | 'training'
  | 'safety'
  | 'policy'
  | 'other'

export type AnnouncementPriority = 'normal' | 'important' | 'urgent'

export type AnnouncementStatus = 'published' | 'draft' | 'archived'

/** Who an announcement is meant for. Only stored for now; the backend will decide visibility later. */
export type AnnouncementAudience = 'all' | 'department' | 'role' | 'location'

/**
 * Announcement content is structured blocks, never raw HTML. They render through normal React
 * elements, so nothing from a future admin/backend can inject markup.
 */
export type AnnouncementBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }

export interface AnnouncementAttachment {
  id: string
  name: string
  fileType: string
  size?: number
  /** Real download address, once file storage exists. Sample attachments have none. */
  url?: string
}

/**
 * An announcement. Shaped to match a future Laravel `announcements` resource, including what an
 * administrator will manage later (status, audience, expiry, pinning, attachments, related items).
 * Dates are ISO strings with the Philippine offset, e.g. 2026-09-30T08:30:00+08:00.
 */
export interface Announcement {
  id: string
  title: string
  summary: string
  content: AnnouncementBlock[]
  category: AnnouncementCategory
  /** Department the announcement applies to or comes from; matches the Employee Directory departments. */
  department?: string
  /** Sending department or office. Never a person's name in sample data. */
  author?: string
  publishedAt: string
  updatedAt?: string
  /** After this moment the announcement stops being shown (future admin feature). */
  expiresAt?: string
  priority: AnnouncementPriority
  status: AnnouncementStatus
  isPinned?: boolean
  audience?: AnnouncementAudience
  tags?: string[]
  /** Ids that point at existing modules. Their data is not duplicated here. */
  relatedDocumentId?: string
  relatedEventId?: string
  relatedServiceId?: string
  relatedFormId?: string
  attachments?: AnnouncementAttachment[]
  /** Frontend-only read state for the announcement experience (PATCH /api/announcements/{id}/read later). */
  isRead?: boolean
  /** True for development sample records. */
  isSample?: boolean
}

export type AnnouncementSort = 'newest' | 'oldest' | 'az' | 'za'

export type AnnouncementDateRange = 'any' | '7d' | '30d' | '90d'

/** Query parameters that map to a future `GET /api/announcements` request. */
export interface AnnouncementQuery {
  search?: string
  category?: AnnouncementCategory
  department?: string
  priority?: AnnouncementPriority
  status?: Exclude<AnnouncementStatus, 'draft'>
  range?: AnnouncementDateRange
  sort?: AnnouncementSort
  page?: number
  perPage?: number
}

export interface RelatedResource {
  kind: 'document' | 'event' | 'service' | 'form'
  id: string
  title: string
  href: string
  actionLabel: string
}

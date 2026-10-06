import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/announcements.api'
import { ANNOUNCEMENT_PAGE_SIZE, announcementCategories, getAnnouncementCategoryLabel } from '@/data/announcementCategories'
import { announcements } from '@/data/announcements'
import { getDocument } from '@/services/documentService'
import { getEvent } from '@/services/eventService'
import { getFormDetail } from '@/services/formService'
import type { PaginatedResponse } from '@/types/employee'
import type { Announcement, AnnouncementQuery, RelatedResource } from '@/types/announcement'

/**
 * Service layer for announcements.
 * Each function maps to a future Laravel endpoint; replace the body with a `fetch` call returning the
 * same shape and no component changes. Drafts are never returned to employees.
 *
 * Read state is kept in memory here as a stand-in for PATCH /api/announcements/{id}/read.
 */

const MOCK_LATENCY_MS = 200
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

const readIds = new Set(announcements.filter((a) => a.isRead).map((a) => a.id))
const withRead = (a: Announcement): Announcement => ({ ...a, isRead: readIds.has(a.id) })

const visible = () => announcements.filter((a) => a.status !== 'draft').map(withRead)

const timeOf = (a: Announcement) => new Date(a.publishedAt).getTime()

function matchesSearch(a: Announcement, search: string) {
  const content = a.content
    .map((b) => (b.type === 'list' ? b.items.join(' ') : b.text))
    .join(' ')
  const haystack = [a.title, a.summary, content, a.department, a.author, getAnnouncementCategoryLabel(a.category), ...(a.tags ?? [])]
    .join(' ')
    .toLowerCase()
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

const rangeDays = { '7d': 7, '30d': 30, '90d': 90 } as const

function compare(a: Announcement, b: Announcement, sort: NonNullable<AnnouncementQuery['sort']>) {
  switch (sort) {
    case 'oldest':
      return timeOf(a) - timeOf(b)
    case 'az':
      return a.title.localeCompare(b.title)
    case 'za':
      return b.title.localeCompare(a.title)
    default:
      return timeOf(b) - timeOf(a)
  }
}

/** GET /api/announcements. Pinned announcements stay above the rest, then the chosen sort applies. */
async function mockGetAnnouncements(query: AnnouncementQuery = {}): Promise<PaginatedResponse<Announcement>> {
  await wait()
  const { search, category, department, priority, status = 'published', range = 'any', sort = 'newest', page = 1, perPage = ANNOUNCEMENT_PAGE_SIZE } = query
  const cutoff = range === 'any' ? undefined : Date.now() - rangeDays[range] * 24 * 60 * 60 * 1000

  const filtered = visible()
    .filter((a) => a.status === status)
    .filter((a) => (search?.trim() ? matchesSearch(a, search) : true))
    .filter((a) => (category ? a.category === category : true))
    .filter((a) => (department ? a.department === department : true))
    .filter((a) => (priority ? a.priority === priority : true))
    .filter((a) => (cutoff ? timeOf(a) >= cutoff : true))
    .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) || compare(a, b, sort))

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * perPage
  return { data: filtered.slice(start, start + perPage), current_page: currentPage, per_page: perPage, total, last_page: lastPage }
}

/** GET /api/announcements/{id} */
async function mockGetAnnouncement(id: string): Promise<Announcement | null> {
  await wait()
  return visible().find((a) => a.id === id) ?? null
}

/** GET /api/announcements/recent */
async function mockGetRecentAnnouncements(limit = 4): Promise<Announcement[]> {
  await wait()
  return visible()
    .filter((a) => a.status === 'published')
    .sort((a, b) => timeOf(b) - timeOf(a))
    .slice(0, limit)
}

/** GET /api/announcements/pinned */
async function mockGetPinnedAnnouncements(): Promise<Announcement[]> {
  await wait()
  return visible()
    .filter((a) => a.status === 'published' && a.isPinned)
    .sort((a, b) => timeOf(b) - timeOf(a))
}

/** GET /api/announcements/categories */
export async function getAnnouncementCategories() {
  await wait()
  return announcementCategories
}

/** PATCH /api/announcements/{id}/read (mock: in memory only) */
export async function markAnnouncementRead(id: string): Promise<void> {
  readIds.add(id)
  await wait()
}

/** Looks up the existing Documents / Calendar / Forms records an announcement points to. */
export async function getRelatedResources(announcement: Announcement): Promise<RelatedResource[]> {
  const resources: RelatedResource[] = []

  const [document, event, form] = await Promise.all([
    announcement.relatedDocumentId ? getDocument(announcement.relatedDocumentId) : null,
    announcement.relatedEventId ? getEvent(announcement.relatedEventId) : null,
    announcement.relatedFormId ? getFormDetail(announcement.relatedFormId) : null,
  ])

  if (document) resources.push({ kind: 'document', id: document.id, title: document.title, href: `/documents/${document.id}`, actionLabel: 'View Document' })
  if (event) resources.push({ kind: 'event', id: event.id, title: event.title, href: `/calendar/${event.id}`, actionLabel: 'View Event' })
  if (form) {
    const title = form.form?.title ?? form.requestType?.title ?? 'Form'
    resources.push({ kind: 'form', id: announcement.relatedFormId!, title, href: `/forms/${announcement.relatedFormId}`, actionLabel: 'View Form' })
  }
  return resources
}

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getAnnouncements: typeof mockGetAnnouncements = isApiMode ? apiAdapter.getAnnouncements : mockGetAnnouncements
export const getAnnouncement: typeof mockGetAnnouncement = isApiMode ? apiAdapter.getAnnouncement : mockGetAnnouncement
export const getRecentAnnouncements: typeof mockGetRecentAnnouncements = isApiMode ? apiAdapter.getRecentAnnouncements : mockGetRecentAnnouncements
export const getPinnedAnnouncements: typeof mockGetPinnedAnnouncements = isApiMode ? apiAdapter.getPinnedAnnouncements : mockGetPinnedAnnouncements

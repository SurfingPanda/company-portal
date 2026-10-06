import { api } from '@/services/api'
import { toPaginated, type ApiPage } from '@/services/adapters/paginate'
import type { ApiResponse } from '@/types/api'
import type { PaginatedResponse } from '@/types/employee'
import type { Announcement, AnnouncementBlock, AnnouncementCategory, AnnouncementPriority, AnnouncementQuery } from '@/types/announcement'
import { ANNOUNCEMENT_PAGE_SIZE } from '@/data/announcementCategories'

/**
 * Announcements, Laravel adapter: GET /api/announcements[/{id}]. Laravel returns only published announcements inside their
 * publish/expiry window to employees. Content is stored as text and turned into the portal's structured blocks here
 * (blank-line separated paragraphs, "## " headings, "- " lists), so nothing is ever rendered as HTML.
 */
interface ApiAnnouncement {
  id: number
  title: string
  summary: string
  content: string
  category: AnnouncementCategory
  priority: AnnouncementPriority
  is_pinned: boolean
  published_at: string | null
  expires_at: string | null
  is_sample?: boolean
}

export function parseContent(text: string): AnnouncementBlock[] {
  const blocks: AnnouncementBlock[] = []
  for (const chunk of text.split(/\n{2,}/)) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue
    if (lines.every((l) => /^[-*]\s+/.test(l))) blocks.push({ type: 'list', items: lines.map((l) => l.replace(/^[-*]\s+/, '')) })
    else if (lines.length === 1 && lines[0].startsWith('## ')) blocks.push({ type: 'heading', text: lines[0].slice(3) })
    else blocks.push({ type: 'paragraph', text: lines.join(' ') })
  }
  return blocks
}

const toAnnouncement = (a: ApiAnnouncement): Announcement => ({
  id: String(a.id),
  title: a.title,
  summary: a.summary,
  content: parseContent(a.content),
  category: a.category,
  publishedAt: a.published_at ?? '',
  expiresAt: a.expires_at ?? undefined,
  priority: a.priority,
  status: 'published',
  isPinned: a.is_pinned,
  isSample: a.is_sample,
})

const SORTS = { newest: ['published_at', 'desc'], oldest: ['published_at', 'asc'], az: ['title', 'asc'], za: ['title', 'desc'] } as const
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 } as const

export async function getAnnouncements(query: AnnouncementQuery = {}): Promise<PaginatedResponse<Announcement>> {
  const { search, category, priority, range = 'any', sort = 'newest', page = 1, perPage = ANNOUNCEMENT_PAGE_SIZE } = query
  const [column, direction] = SORTS[sort]
  const from = range === 'any' ? undefined : new Date(Date.now() - RANGE_DAYS[range] * 86_400_000).toISOString().slice(0, 10)
  const result = await api.get<ApiPage<ApiAnnouncement>>('/api/announcements', { search: search?.trim(), category, priority, from, sort: column, direction, page, per_page: perPage })
  return toPaginated(result, toAnnouncement)
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  try {
    return toAnnouncement((await api.get<ApiResponse<ApiAnnouncement>>(`/api/announcements/${encodeURIComponent(id)}`)).data)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

export async function getRecentAnnouncements(limit = 4): Promise<Announcement[]> {
  const result = await api.get<ApiPage<ApiAnnouncement>>('/api/announcements', { sort: 'published_at', direction: 'desc', per_page: limit })
  return result.data.map(toAnnouncement)
}

export async function getPinnedAnnouncements(): Promise<Announcement[]> {
  const result = await api.get<ApiPage<ApiAnnouncement>>('/api/announcements', { pinned: true, per_page: 20 })
  return result.data.map(toAnnouncement)
}

import { api } from '@/services/api'
import type { ApiResponse } from '@/types/api'
import type { EmployeeActivity, ActivityType } from '@/types/activity'
import type { Notification, NotificationType } from '@/types/notification'

/**
 * API adapter: talks to Laravel through the central client. Every call is scoped to the signed-in employee on the
 * server (the frontend never sends a user id). Failures are thrown, never replaced with mock data.
 *
 *   GET   /api/notifications?per_page=N   -> { data: ApiNotification[], meta }
 *   POST  /api/notifications/{id}/read
 *   POST  /api/notifications/read-all
 *   GET   /api/activity?per_page=N        -> { data: ApiActivity[], meta }
 */

interface ApiNotification {
  id: number
  type: NotificationType
  title: string
  message: string
  link: string | null
  read_at: string | null
  created_at: string
  is_sample?: boolean
}

interface ApiActivity {
  id: number
  type: string
  description: string
  entity_id: number | null
  created_at: string
}

const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt)

const toNotification = (n: ApiNotification): Notification => ({
  id: String(n.id),
  type: n.type,
  title: n.title,
  message: n.message,
  href: n.link ?? undefined,
  createdAt: n.created_at,
  isRead: n.read_at !== null,
  isSample: n.is_sample,
})

/** `request_submitted` -> the feed's "request" category; anything unknown is a generic "service" entry. */
const activityType = (type: string): ActivityType => {
  const category = type.split('_')[0]
  return (['request', 'document', 'event', 'profile'] as string[]).includes(category) ? (category as ActivityType) : 'service'
}

export async function getNotifications(): Promise<Notification[]> {
  const response = await api.get<ApiResponse<ApiNotification[]>>('/api/notifications', { per_page: 100 })
  return response.data.map(toNotification).sort(newestFirst)
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post<void>(`/api/notifications/${encodeURIComponent(id)}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post<void>('/api/notifications/read-all')
}

/** The backend records activity when it processes an action (request submitted, ticket created…). The browser sends nothing. */
export async function addActivity(): Promise<void> {
  // intentionally empty
}

export async function getActivity(limit?: number): Promise<EmployeeActivity[]> {
  const response = await api.get<ApiResponse<ApiActivity[]>>('/api/activity', { per_page: limit })
  return response.data.map((a) => ({ id: String(a.id), action: a.description, type: activityType(a.type), createdAt: a.created_at }))
}

import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/notifications.api'
import * as mockAdapter from '@/services/adapters/notifications.mock'
import type { EmployeeActivity } from '@/types/activity'
import type { Notification } from '@/types/notification'

/**
 * Notifications and activity: the FIRST feature migrated to the adapter pattern (the template for the others).
 *
 *   UI -> notificationService -> mock adapter (development) OR API adapter (Laravel)
 *
 * The adapter is chosen once from the data mode (services/dataMode.ts); production is always "api". Components and the
 * NotificationProvider are unchanged. In API mode a failure rejects so the UI shows its error/retry state; it is never
 * hidden behind sample data.
 */
const adapter = isApiMode ? apiAdapter : mockAdapter

/** GET /api/notifications (the signed-in employee's notifications, newest first). */
export const getNotifications = (): Promise<Notification[]> => adapter.getNotifications()

/** Unread subset of the employee's notifications. */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const all = await getNotifications()
  return all.filter((n) => !n.isRead)
}

/** PATCH /api/notifications/{id}/read */
export const markNotificationRead = (id: string): Promise<void> => adapter.markNotificationRead(id)

/** POST /api/notifications/read-all */
export const markAllNotificationsRead = (): Promise<void> => adapter.markAllNotificationsRead()

/** Mock mode: records a sample activity in memory. API mode: no-op, because the server records activity itself. */
export const addActivity: (entry: Omit<EmployeeActivity, 'id' | 'createdAt'>) => Promise<void> = (entry) => (isApiMode ? apiAdapter.addActivity() : mockAdapter.addActivity(entry))

/** GET /api/activity */
export const getActivity = (limit?: number): Promise<EmployeeActivity[]> => adapter.getActivity(limit)

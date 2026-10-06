import { activity } from '@/data/activity'
import { notifications } from '@/data/notifications'
import type { EmployeeActivity } from '@/types/activity'
import type { Notification } from '@/types/notification'

/** MOCK adapter (development only): reads the sample data in src/data. Nothing is persisted. */

const MOCK_LATENCY_MS = 200
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))
const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt)

export async function getNotifications(): Promise<Notification[]> {
  await wait()
  return notifications.map((n) => ({ ...n })).sort(newestFirst)
}

export async function markNotificationRead(id: string): Promise<void> {
  void id
  await wait()
}

export async function markAllNotificationsRead(): Promise<void> {
  await wait()
}

const activityStore: EmployeeActivity[] = [...activity]

/** Records a sample activity in memory. In API mode the backend records activity itself. */
export async function addActivity(entry: Omit<EmployeeActivity, 'id' | 'createdAt'>): Promise<void> {
  const d = new Date()
  const pad = (x: number) => String(x).padStart(2, '0')
  const createdAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  activityStore.unshift({ ...entry, id: `a-local-${d.getTime()}`, createdAt, isSample: true })
}

export async function getActivity(limit?: number): Promise<EmployeeActivity[]> {
  await wait()
  const sorted = [...activityStore].sort(newestFirst)
  return limit ? sorted.slice(0, limit) : sorted
}

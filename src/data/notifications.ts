import type { Notification, NotificationPriority, NotificationType } from '@/types/notification'

/**
 * SAMPLE NOTIFICATIONS (development only).
 *
 * These do not represent real company activity. Timestamps are generated relative to "now" when the app
 * loads so the relative-time display ("10 minutes ago") always looks natural in the prototype.
 * Replaced by `GET /api/notifications` once the Laravel backend exists. Links point only at pages that exist.
 */

const MINUTE = 60 * 1000
const ago = (minutes: number) => {
  const d = new Date(Date.now() - minutes * MINUTE)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const HOUR = 60
const DAY = 24 * HOUR

interface Seed {
  title: string
  message: string
  type: NotificationType
  minutesAgo: number
  isRead?: boolean
  priority?: NotificationPriority
  href?: string
  relatedId?: string
}

const seeds: Seed[] = [
  { title: 'IT Equipment Request Updated', message: 'Your request REQ-2026-0001 is now under review.', type: 'request', minutesAgo: 10, href: '/requests/REQ-2026-0001', relatedId: 'REQ-2026-0001' },
  { title: 'Upcoming Event', message: 'Company Meeting is scheduled for October 5.', type: 'event', minutesAgo: 1 * HOUR, href: '/calendar/evt-010', relatedId: 'evt-010' },
  { title: 'System Notice', message: 'Scheduled maintenance may affect selected internal services.', type: 'system', minutesAgo: 3 * HOUR, priority: 'important' },
  { title: 'HR Notice', message: 'The leave forms submission deadline is today.', type: 'hr', minutesAgo: 5 * HOUR, href: '/calendar/evt-009', relatedId: 'evt-009' },
  { title: 'New Document Available', message: 'The Intranet Portal User Guide has been added to Documents & Resources.', type: 'document', minutesAgo: 8 * HOUR, href: '/documents/doc-024', relatedId: 'doc-024' },
  { title: 'Request Approved', message: 'Your leave request has been approved.', type: 'request', minutesAgo: 1 * DAY + 2 * HOUR, isRead: true, href: '/requests/LV-2026-0002', relatedId: 'LV-2026-0002' },
  { title: 'New Company Event', message: 'Employee Wellness Week has been added to the company calendar.', type: 'event', minutesAgo: 1 * DAY + 4 * HOUR, href: '/calendar/evt-018', relatedId: 'evt-018' },
  { title: 'Employee Handbook Updated', message: 'The employee handbook has a new version available.', type: 'document', minutesAgo: 3 * DAY, isRead: true, href: '/documents/doc-025', relatedId: 'doc-025' },
  { title: 'Request Submitted', message: 'Your Travel Request has been submitted.', type: 'request', minutesAgo: 1 * DAY + 9 * HOUR, isRead: true, href: '/requests/REQ-2026-0004', relatedId: 'REQ-2026-0004' },
  { title: 'Company Announcement', message: 'Updated employee handbook is now available in the document repository.', type: 'announcement', minutesAgo: 3 * DAY + 2 * HOUR, isRead: true, href: '/announcements/ann-002', relatedId: 'ann-002' },
  { title: 'Network Maintenance', message: 'Network services in selected offices will undergo scheduled maintenance.', type: 'announcement', minutesAgo: 1 * DAY + 20 * HOUR, priority: 'important', href: '/announcements/ann-001', relatedId: 'ann-001' },
  { title: 'IT Notice', message: 'The Email Setup Guide has been updated.', type: 'it', minutesAgo: 2 * DAY, isRead: true, href: '/documents/doc-029', relatedId: 'doc-029' },
  { title: 'Event Cancelled', message: 'Staff Training on October 6 has been cancelled.', type: 'event', minutesAgo: 2 * DAY + 3 * HOUR, href: '/calendar/evt-011', relatedId: 'evt-011' },
  { title: 'Request Completed', message: 'Your Employee Information Update request has been completed.', type: 'request', minutesAgo: 6 * DAY, isRead: true, href: '/requests/REQ-2026-0003', relatedId: 'REQ-2026-0003' },
  { title: 'Event Postponed', message: 'Inventory Review Meeting has been postponed. A new date will be confirmed.', type: 'event', minutesAgo: 4 * DAY, isRead: true, href: '/calendar/evt-015', relatedId: 'evt-015' },
  { title: 'HR Notice', message: 'Reminder to review your employee information in the portal.', type: 'hr', minutesAgo: 5 * DAY, isRead: true },
  { title: 'IT Notice', message: 'A password reset guide is available in Documents & Resources.', type: 'it', minutesAgo: 7 * DAY, isRead: true, href: '/documents/doc-030', relatedId: 'doc-030' },
  { title: 'Request Status Updated', message: 'Your Office Supply Request was rejected.', type: 'request', minutesAgo: 12 * DAY, isRead: true, href: '/requests/REQ-2026-0005', relatedId: 'REQ-2026-0005' },
  { title: 'October Company Activities', message: 'View the schedule of company activities and employee events for October.', type: 'announcement', minutesAgo: 5 * DAY + 6 * HOUR, isRead: true, href: '/announcements/ann-003', relatedId: 'ann-003' },
  { title: 'Portal Update', message: 'Forms & Requests are now available in the portal.', type: 'system', minutesAgo: 14 * DAY, isRead: true, href: '/forms' },
]

export const notifications: Notification[] = seeds.map((seed, index) => ({
  id: `n-${String(index + 1).padStart(3, '0')}`,
  title: seed.title,
  message: seed.message,
  type: seed.type,
  createdAt: ago(seed.minutesAgo),
  isRead: seed.isRead ?? false,
  priority: seed.priority ?? 'normal',
  href: seed.href,
  relatedId: seed.relatedId,
  isSample: true,
}))

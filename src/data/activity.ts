import type { EmployeeActivity } from '@/types/activity'

/**
 * SAMPLE ACTIVITY FEED (development only). Nothing is recorded from real browsing yet.
 * Replaced by `GET /api/activity` later.
 */

const MINUTE = 60 * 1000
const ago = (minutes: number) => {
  const d = new Date(Date.now() - minutes * MINUTE)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const seeds: EmployeeActivity[] = [
  { id: 'a-001', action: 'Submitted IT Equipment Request', description: 'REQ-2026-0001', type: 'request', createdAt: ago(10), href: '/requests/REQ-2026-0001' },
  { id: 'a-002', action: 'Opened Company Calendar', type: 'event', createdAt: ago(95), href: '/calendar' },
  { id: 'a-003', action: 'Viewed IT Helpdesk', type: 'service', createdAt: ago(26 * 60), href: '/helpdesk' },
  { id: 'a-004', action: 'Viewed Employee Handbook', type: 'document', createdAt: ago(27 * 60), href: '/documents/doc-025' },
  { id: 'a-005', action: 'Submitted Leave Request', description: 'LV-2026-0002', type: 'request', createdAt: ago(3 * 24 * 60), href: '/requests/LV-2026-0002' },
  { id: 'a-006', action: 'Viewed Employee Profile', type: 'profile', createdAt: ago(4 * 24 * 60), href: '/directory/EMP-001' },
  { id: 'a-007', action: 'Viewed Leave Request Form', type: 'document', createdAt: ago(5 * 24 * 60), href: '/forms/form-leave' },
]

export const activity: EmployeeActivity[] = seeds.map((a) => ({ ...a, isSample: true }))

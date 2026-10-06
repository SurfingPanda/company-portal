import { CalendarDays, ClipboardCheck, FileText, Headset, Megaphone, Settings, Users, type LucideIcon } from 'lucide-react'
import type { NotificationType } from '@/types/notification'

export const notificationMeta: Record<NotificationType, { icon: LucideIcon; label: string; filterLabel: string }> = {
  announcement: { icon: Megaphone, label: 'Announcement', filterLabel: 'Announcements' },
  request: { icon: ClipboardCheck, label: 'Request', filterLabel: 'Requests' },
  event: { icon: CalendarDays, label: 'Event', filterLabel: 'Events' },
  document: { icon: FileText, label: 'Document', filterLabel: 'Documents' },
  system: { icon: Settings, label: 'System', filterLabel: 'System' },
  hr: { icon: Users, label: 'HR', filterLabel: 'HR' },
  it: { icon: Headset, label: 'IT', filterLabel: 'IT' },
}

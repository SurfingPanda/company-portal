export type NotificationType = 'announcement' | 'request' | 'event' | 'document' | 'system' | 'hr' | 'it'

export type NotificationPriority = 'normal' | 'important'

/**
 * A portal notification. Shaped to match a future Laravel `notifications` resource.
 * `type` and `relatedId` let the backend link a notification to the thing that caused it
 * (a request, event, document, or later an announcement).
 */
export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  /** ISO date-time. The display text ("10 minutes ago") is always calculated, never stored. */
  createdAt: string
  isRead: boolean
  priority?: NotificationPriority
  /** Portal route to open. Leave undefined when the destination does not exist yet. */
  href?: string
  relatedId?: string
  /** True for development sample records. */
  isSample?: boolean
}

/** Fields needed to add a notification on the client. The id, time and read state are filled in. */
export type NewNotification = Pick<Notification, 'title' | 'message' | 'type'> &
  Partial<Pick<Notification, 'priority' | 'href' | 'relatedId'>>

export type NotificationFilter = 'all' | 'unread' | NotificationType

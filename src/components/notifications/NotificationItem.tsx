import { Link } from 'react-router-dom'
import { RelativeTime } from '@/components/common/RelativeTime'
import { notificationMeta } from '@/components/notifications/notificationMeta'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/notification'

/** Icon, title, message, category and time. Shared by the dropdown (compact) and the page (full). */
export function NotificationContent({ notification, compact = false }: { notification: Notification; compact?: boolean }) {
  const { icon: Icon, label } = notificationMeta[notification.type]
  const important = notification.priority === 'important'

  return (
    <div className="flex min-w-0 gap-3">
      <span
        aria-hidden="true"
        className={cn('flex shrink-0 items-center justify-center border text-primary', compact ? 'size-8' : 'size-9', notification.isRead ? 'bg-white' : 'bg-secondary')}
      >
        <Icon className="size-4" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {!notification.isRead && (
            <>
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-gold" />
              <span className="sr-only">Unread: </span>
            </>
          )}
          <span className={cn('text-sm text-foreground', notification.isRead ? 'font-medium' : 'font-semibold')}>{notification.title}</span>
          {important && <span className="border border-gold/50 px-1 text-[0.625rem] font-semibold uppercase tracking-wider text-gold">Important</span>}
        </p>
        <p className={cn('mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground', compact && 'line-clamp-2')}>{notification.message}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground/90">
          <span className="font-medium text-foreground/70">{label}</span>
          <RelativeTime iso={notification.createdAt} />
        </p>
      </div>
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

/** Full notification row for the Notifications page, with its actions. */
export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  return (
    <article
      className={cn(
        'flex flex-col gap-3 border-l-[3px] px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between',
        notification.isRead ? 'border-l-transparent bg-white' : 'border-l-primary bg-accent/40',
      )}
    >
      <NotificationContent notification={notification} />
      <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
        {notification.href && (
          <Button asChild variant="outline" size="sm" className="bg-white">
            <Link to={notification.href} onClick={() => onMarkAsRead(notification.id)} aria-label={`Open: ${notification.title}`}>
              View
            </Link>
          </Button>
        )}
        {!notification.isRead && (
          <Button variant="ghost" size="sm" className="text-primary" onClick={() => onMarkAsRead(notification.id)} aria-label={`Mark as read: ${notification.title}`}>
            Mark as read
          </Button>
        )}
      </div>
    </article>
  )
}

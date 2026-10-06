import { NotificationItem } from '@/components/notifications/NotificationItem'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Notification, NotificationFilter } from '@/types/notification'

interface NotificationListProps {
  notifications: Notification[]
  filter: NotificationFilter
  loading: boolean
  error?: Error
  onRetry: () => void
  onMarkAsRead: (id: string) => void
  onClearFilter: () => void
}

export function NotificationList({ notifications, filter, loading, error, onRetry, onMarkAsRead, onClearFilter }: NotificationListProps) {
  if (error) {
    return (
      <div className="border border-destructive/30 bg-white px-6 py-10 text-center" role="alert">
        <h2 className="font-serif text-xl font-semibold text-primary">Unable to load notifications</h2>
        <p className="mt-2 text-sm text-muted-foreground">Please try again later.</p>
        <Button className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading notifications" aria-busy="true" className="divide-y border bg-white">
        <span className="sr-only">Loading notifications…</span>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex gap-3 px-4 py-3.5">
            <Skeleton className="size-9 shrink-0 rounded-sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 max-w-full rounded-sm" />
              <Skeleton className="h-3 w-full max-w-md rounded-sm" />
              <Skeleton className="h-3 w-20 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    const caughtUp = filter === 'all' || filter === 'unread'
    return (
      <div className="border bg-white px-6 py-12 text-center" role="status">
        <h2 className="font-serif text-xl font-semibold text-primary">{caughtUp ? "You're all caught up" : 'No notifications'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {caughtUp ? "You don't have any new notifications." : 'There are no notifications in this category.'}
        </p>
        {filter !== 'all' && (
          <Button variant="outline" className="mt-5 bg-white" onClick={onClearFilter}>
            Show All Notifications
          </Button>
        )}
      </div>
    )
  }

  return (
    <ul aria-label="Notifications" className="divide-y border bg-white">
      {notifications.map((n) => (
        <li key={n.id}>
          <NotificationItem notification={n} onMarkAsRead={onMarkAsRead} />
        </li>
      ))}
    </ul>
  )
}

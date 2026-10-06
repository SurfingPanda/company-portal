import { Link, useNavigate } from 'react-router-dom'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { NotificationContent } from '@/components/notifications/NotificationItem'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/context/NotificationContext'
import { cn } from '@/lib/utils'

const MAX_ITEMS = 5

/**
 * Compact notification dropdown for the navbar. Closes on outside click and Escape (Radix handles both),
 * shows the five most recent notifications, and marks a notification read when it is opened.
 */
export function NotificationDropdown() {
  const { notifications, unreadCount, loading, error, retry, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()
  const recent = notifications.slice(0, MAX_ITEMS)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <NotificationBell />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={8} className="w-[min(24rem,calc(100vw-1rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="font-serif text-base font-semibold text-primary">
            Notifications
            {unreadCount > 0 && <span className="ml-2 text-xs font-sans font-medium text-muted-foreground">{unreadCount} unread</span>}
          </h2>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="rounded-sm text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:text-muted-foreground disabled:no-underline"
          >
            Mark all as read
          </button>
        </div>

        {error ? (
          <div role="alert" className="px-4 py-6 text-center text-sm">
            <p className="font-semibold text-primary">Unable to load notifications</p>
            <p className="mt-0.5 text-muted-foreground">Please try again later.</p>
            <button type="button" onClick={retry} className="mt-2 text-primary underline underline-offset-4">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div role="status" aria-label="Loading notifications" className="space-y-px">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-none" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="px-4 py-8 text-center" role="status">
            <p className="font-serif text-base font-semibold text-primary">You&apos;re all caught up</p>
            <p className="mt-0.5 text-sm text-muted-foreground">You don&apos;t have any new notifications.</p>
          </div>
        ) : (
          <ul>
            {recent.map((n) => (
              <li key={n.id} className="border-b last:border-b-0">
                <DropdownMenuItem
                  className={cn('block cursor-pointer rounded-none px-4 py-3', !n.isRead && 'bg-accent/40')}
                  onSelect={(e) => {
                    markAsRead(n.id)
                    if (n.href) navigate(n.href)
                    else e.preventDefault() // no destination: keep the menu open and just mark it read
                  }}
                >
                  <NotificationContent notification={n} compact />
                </DropdownMenuItem>
              </li>
            ))}
          </ul>
        )}

        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem asChild className="justify-center rounded-none py-2.5 text-sm font-medium text-primary">
          <Link to="/notifications">View All Notifications →</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

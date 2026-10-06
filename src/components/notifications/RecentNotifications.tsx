import { Link } from 'react-router-dom'
import { SectionHeading, SectionLink } from '@/components/common/SectionHeading'
import { RelativeTime } from '@/components/common/RelativeTime'
import { notificationMeta } from '@/components/notifications/notificationMeta'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/context/NotificationContext'
import { cn } from '@/lib/utils'

/** Compact "Recent Notifications" for the Home page. Uses the shared notification state. */
export function RecentNotifications({ limit = 3 }: { limit?: number }) {
  const { notifications, loading, error, retry, markAsRead } = useNotifications()
  const recent = notifications.slice(0, limit)

  return (
    <section aria-labelledby="recent-notifications-heading">
      <SectionHeading id="recent-notifications-heading" title="Recent Notifications" action={<SectionLink href="/notifications">View all</SectionLink>} />
      {error ? (
        <div role="alert" className="border bg-white px-4 py-5 text-sm">
          <p className="font-semibold text-primary">Unable to load notifications</p>
          <button type="button" onClick={retry} className="mt-1 text-primary underline underline-offset-4">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div role="status" aria-label="Loading notifications" className="space-y-px">
          {Array.from({ length: limit }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-none" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="border bg-white px-4 py-6 text-center" role="status">
          <p className="font-serif text-base font-semibold text-primary">You&apos;re all caught up</p>
          <p className="mt-0.5 text-sm text-muted-foreground">You don&apos;t have any new notifications.</p>
        </div>
      ) : (
        <ul className="divide-y bg-white ring-1 ring-border">
          {recent.map((n) => {
            const { icon: Icon, label } = notificationMeta[n.type]
            const body = (
              <span className="flex min-w-0 gap-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    {!n.isRead && (
                      <>
                        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-gold" />
                        <span className="sr-only">Unread: </span>
                      </>
                    )}
                    <span className={cn('truncate text-sm text-foreground', n.isRead ? 'font-medium' : 'font-semibold')}>{n.title}</span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{n.message}</span>
                  <span className="block text-xs text-muted-foreground/90">
                    {label} · <RelativeTime iso={n.createdAt} />
                  </span>
                </span>
              </span>
            )
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link
                    to={n.href}
                    onClick={() => markAsRead(n.id)}
                    className="block px-4 py-2.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="px-4 py-2.5">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

import { useSearchParams } from 'react-router-dom'
import { ActivityList } from '@/components/activity/ActivityList'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { NotificationFilters } from '@/components/notifications/NotificationFilters'
import { NotificationList } from '@/components/notifications/NotificationList'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/context/NotificationContext'
import type { NotificationFilter } from '@/types/notification'

const FILTERS: NotificationFilter[] = ['all', 'unread', 'announcement', 'request', 'event', 'document', 'system', 'hr', 'it']

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, error, retry, markAsRead, markAllAsRead } = useNotifications()
  const [params, setParams] = useSearchParams()

  const param = params.get('filter') as NotificationFilter | null
  const filter: NotificationFilter = param && FILTERS.includes(param) ? param : 'all'

  const setFilter = (next: NotificationFilter) => setParams(next === 'all' ? {} : { filter: next }, { replace: true })

  // Derived from shared state, so marking an item read removes it from the Unread filter immediately.
  const visible = notifications.filter((n) => (filter === 'all' ? true : filter === 'unread' ? !n.isRead : n.type === filter))

  return (
    <PageContainer className="pb-16">
      <PageHeader
        title="Notifications"
        description="Stay updated with company announcements, requests, events, and important portal activity."
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" className="bg-white" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <p className="mt-6 text-xs text-muted-foreground">
        Sample notifications for development. They do not represent real company activity.
      </p>

      <div className="mt-3">
        <NotificationFilters selected={filter} unreadCount={unreadCount} onChange={setFilter} />
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Notification list" className="min-w-0">
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {!loading && !error && (
              <>
                <span className="font-semibold text-foreground">{visible.length}</span> {visible.length === 1 ? 'notification' : 'notifications'}
                {unreadCount > 0 && <span className="ml-2">· {unreadCount} unread</span>}
              </>
            )}
          </p>
          <NotificationList
            notifications={visible}
            filter={filter}
            loading={loading}
            error={error}
            onRetry={retry}
            onMarkAsRead={markAsRead}
            onClearFilter={() => setFilter('all')}
          />
        </section>

        <aside>
          <ActivityList limit={7} />
        </aside>
      </div>
    </PageContainer>
  )
}

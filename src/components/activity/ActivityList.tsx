import { SectionHeading } from '@/components/common/SectionHeading'
import { ActivityItem } from '@/components/activity/ActivityItem'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getActivity } from '@/services/notificationService'

interface ActivityListProps {
  limit?: number
  title?: string
  headingId?: string
}

/** "Recent Activity" feed. Mock data; nothing is recorded from real browsing. */
export function ActivityList({ limit = 5, title = 'Recent Activity', headingId = 'recent-activity-heading' }: ActivityListProps) {
  const { data, error, retry } = useAsync(() => getActivity(limit), [limit])

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId} title={title} />
      {error ? (
        <div role="alert" className="border bg-white px-4 py-5 text-sm">
          <p className="font-semibold text-primary">Unable to load activity</p>
          <button type="button" onClick={retry} className="mt-1 text-primary underline underline-offset-4">
            Retry
          </button>
        </div>
      ) : !data ? (
        <div role="status" aria-label="Loading activity" className="space-y-px">
          {Array.from({ length: Math.min(limit, 4) }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-none" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="border bg-white px-4 py-6 text-center" role="status">
          <p className="font-serif text-base font-semibold text-primary">No recent activity</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Your recent portal activity will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y bg-white ring-1 ring-border" aria-label={title}>
          {data.map((activity) => (
            <li key={activity.id}>
              <ActivityItem activity={activity} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

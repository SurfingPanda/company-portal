import { CalendarDays, ClipboardList, FileText, LayoutGrid, UserRound, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RelativeTime } from '@/components/common/RelativeTime'
import type { ActivityType, EmployeeActivity } from '@/types/activity'

const icons: Record<ActivityType, LucideIcon> = {
  request: ClipboardList,
  document: FileText,
  event: CalendarDays,
  service: LayoutGrid,
  profile: UserRound,
}

/** One compact activity line: icon, what happened, optional detail and time. */
export function ActivityItem({ activity }: { activity: EmployeeActivity }) {
  const Icon = icons[activity.type]
  const content = (
    <span className="flex min-w-0 gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{activity.action}</span>
        {activity.description && <span className="block font-mono text-xs text-muted-foreground">{activity.description}</span>}
        <RelativeTime iso={activity.createdAt} className="block text-xs text-muted-foreground" />
      </span>
    </span>
  )

  return activity.href ? (
    <Link
      to={activity.href}
      className="block px-4 py-2.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      {content}
    </Link>
  ) : (
    <div className="px-4 py-2.5">{content}</div>
  )
}

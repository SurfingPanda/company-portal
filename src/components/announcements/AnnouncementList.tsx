import { AnnouncementCard } from '@/components/announcements/AnnouncementCard'
import { AnnouncementRow } from '@/components/announcements/AnnouncementRow'
import { cn } from '@/lib/utils'
import type { Announcement } from '@/types/announcement'

/** Rows on md+ screens, compact cards below. Both render the same announcements. */
export function AnnouncementList({ announcements, busy }: { announcements: Announcement[]; busy?: boolean }) {
  return (
    <div className={cn('transition-opacity', busy && 'opacity-60')} aria-busy={busy}>
      <ul aria-label="Announcements" className="hidden divide-y border md:block">
        {announcements.map((a) => (
          <li key={a.id}>
            <AnnouncementRow announcement={a} />
          </li>
        ))}
      </ul>
      <ul aria-label="Announcements" className="divide-y border md:hidden">
        {announcements.map((a) => (
          <li key={a.id}>
            <AnnouncementCard announcement={a} />
          </li>
        ))}
      </ul>
    </div>
  )
}

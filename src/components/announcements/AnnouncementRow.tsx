import { Link } from 'react-router-dom'
import { AnnouncementCategoryBadge } from '@/components/announcements/AnnouncementCategoryBadge'
import { AnnouncementMeta } from '@/components/announcements/AnnouncementMeta'
import { AnnouncementPriority } from '@/components/announcements/AnnouncementPriority'
import { cn } from '@/lib/utils'
import type { Announcement } from '@/types/announcement'

/** Information-dense list row (md and up): category, title, summary, date and sender, priority. */
export function AnnouncementRow({ announcement }: { announcement: Announcement }) {
  const unread = !announcement.isRead

  return (
    <Link
      to={`/announcements/${announcement.id}`}
      className={cn(
        'group flex items-start gap-4 border-l-[3px] px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        announcement.priority === 'urgent' ? 'border-l-red-700' : announcement.priority === 'important' ? 'border-l-gold' : 'border-l-transparent',
        announcement.isPinned ? 'bg-accent/50' : 'bg-white',
      )}
    >
      <span className="w-32 shrink-0 pt-0.5">
        <AnnouncementCategoryBadge category={announcement.category} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {unread && (
            <>
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-gold" />
              <span className="sr-only">Unread: </span>
            </>
          )}
          <span className={cn('font-serif text-lg leading-snug text-primary group-hover:underline', unread ? 'font-semibold' : 'font-medium')}>{announcement.title}</span>
          <AnnouncementPriority priority={announcement.priority} />
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-foreground/75">{announcement.summary}</span>
        <AnnouncementMeta announcement={announcement} className="mt-1.5" />
      </span>
    </Link>
  )
}

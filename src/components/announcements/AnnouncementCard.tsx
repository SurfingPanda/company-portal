import { Link } from 'react-router-dom'
import { AnnouncementCategoryBadge } from '@/components/announcements/AnnouncementCategoryBadge'
import { AnnouncementMeta } from '@/components/announcements/AnnouncementMeta'
import { AnnouncementPriority } from '@/components/announcements/AnnouncementPriority'
import { cn } from '@/lib/utils'
import type { Announcement } from '@/types/announcement'

/** Compact entry for small screens. */
export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const unread = !announcement.isRead

  return (
    <Link
      to={`/announcements/${announcement.id}`}
      className={cn(
        'block border-l-[3px] px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
        announcement.priority === 'urgent' ? 'border-l-red-700' : announcement.priority === 'important' ? 'border-l-gold' : 'border-l-transparent',
        announcement.isPinned ? 'bg-accent/50' : 'bg-white',
      )}
    >
      <span className="flex flex-wrap items-center gap-2">
        <AnnouncementCategoryBadge category={announcement.category} />
        <AnnouncementPriority priority={announcement.priority} />
      </span>
      <span className="mt-1 flex items-start gap-2">
        {unread && (
          <>
            <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-gold" />
            <span className="sr-only">Unread: </span>
          </>
        )}
        <span className={cn('font-serif text-lg leading-snug text-primary', unread ? 'font-semibold' : 'font-medium')}>{announcement.title}</span>
      </span>
      <span className="mt-0.5 line-clamp-2 block text-sm text-foreground/75">{announcement.summary}</span>
      <AnnouncementMeta announcement={announcement} className="mt-1.5" />
    </Link>
  )
}

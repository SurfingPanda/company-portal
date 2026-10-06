import { Pin } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Announcement } from '@/types/announcement'

interface AnnouncementMetaProps {
  announcement: Pick<Announcement, 'publishedAt' | 'updatedAt' | 'author' | 'department' | 'isPinned'>
  /** "long" for the detail page, "short" for lists. */
  dateStyle?: 'short' | 'long'
  className?: string
}

/** Published date, optional updated date, sender and pinned label. */
export function AnnouncementMeta({ announcement, dateStyle = 'short', className }: AnnouncementMetaProps) {
  const source = announcement.author ?? announcement.department

  return (
    <p className={cn('flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground', className)}>
      {announcement.isPinned && (
        <span className="inline-flex items-center gap-1 font-semibold text-primary">
          <Pin className="size-3" aria-hidden="true" />
          Pinned
        </span>
      )}
      <span>
        <span className="sr-only">Published </span>
        <time dateTime={announcement.publishedAt}>{formatDate(announcement.publishedAt, dateStyle === 'long' ? 'long' : 'short')}</time>
      </span>
      {announcement.updatedAt && (
        <span>
          Updated <time dateTime={announcement.updatedAt}>{formatDate(announcement.updatedAt, dateStyle === 'long' ? 'long' : 'short')}</time>
        </span>
      )}
      {source && <span>{source}</span>}
    </p>
  )
}

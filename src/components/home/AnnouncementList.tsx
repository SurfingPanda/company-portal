import { Link } from 'react-router-dom'
import { AnnouncementMeta } from '@/components/announcements/AnnouncementMeta'
import { AnnouncementPriority } from '@/components/announcements/AnnouncementPriority'
import { SectionHeading } from '@/components/common/SectionHeading'
import { getAnnouncementCategoryLabel } from '@/data/announcementCategories'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Announcement } from '@/types/announcement'

interface AnnouncementListProps {
  /** Latest announcements from the central announcement service. Undefined while loading. */
  announcements: Announcement[] | undefined
}

/** Home page "Latest Announcements": a compact list that links to the full Announcements module. */
export function AnnouncementList({ announcements }: AnnouncementListProps) {
  return (
    <section aria-labelledby="announcements-heading">
      <SectionHeading
        id="announcements-heading"
        title="Company Announcements"
        action={
          <Link
            to="/announcements"
            aria-label="View All Announcements"
            className="shrink-0 text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline"
          >
            <span className="sm:hidden">View all →</span>
            <span className="hidden sm:inline">View All Announcements →</span>
          </Link>
        }
      />
      {!announcements ? (
        <div role="status" aria-label="Loading announcements" className="space-y-px">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-none" />
          ))}
        </div>
      ) : (
        <ul>
          {announcements.map((item) => (
            <li key={item.id} className="border-b border-border first:pt-0">
              <Link
                to={`/announcements/${item.id}`}
                className="group block py-5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:-mx-3 sm:px-3"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <AnnouncementPriority priority={item.priority} />
                  <span className={cn('text-xs font-semibold uppercase tracking-wider text-primary/80')}>{getAnnouncementCategoryLabel(item.category)}</span>
                </div>
                <h3 className="mt-2 font-serif text-[1.375rem] font-semibold leading-snug text-primary group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4">
                  {!item.isRead && (
                    <>
                      <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full bg-gold align-middle" />
                      <span className="sr-only">Unread: </span>
                    </>
                  )}
                  {item.title}
                </h3>
                <p className="mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed text-foreground/75">{item.summary}</p>
                <AnnouncementMeta announcement={item} className="mt-1.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

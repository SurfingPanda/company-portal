import { getAnnouncementCategoryLabel } from '@/data/announcementCategories'
import { cn } from '@/lib/utils'
import type { AnnouncementCategory } from '@/types/announcement'

export function AnnouncementCategoryBadge({ category, className }: { category: AnnouncementCategory; className?: string }) {
  return (
    <span className={cn('text-[0.6875rem] font-semibold uppercase tracking-wider text-primary/80', className)}>
      {getAnnouncementCategoryLabel(category)}
    </span>
  )
}

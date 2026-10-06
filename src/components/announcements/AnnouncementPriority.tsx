import { Info, TriangleAlert } from 'lucide-react'
import { priorityLabels } from '@/data/announcementCategories'
import { cn } from '@/lib/utils'
import type { AnnouncementPriority as Priority } from '@/types/announcement'

interface AnnouncementPriorityProps {
  priority: Priority
  /** Show "Normal" too (detail page). Lists hide it to keep them quiet. */
  showNormal?: boolean
  className?: string
}

/** Priority label with an icon and text, so urgency never relies on colour alone. */
export function AnnouncementPriority({ priority, showNormal = false, className }: AnnouncementPriorityProps) {
  if (priority === 'normal' && !showNormal) return null
  const Icon = priority === 'urgent' ? TriangleAlert : Info

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider',
        priority === 'urgent' && 'border-red-700/50 bg-red-50 text-red-800',
        priority === 'important' && 'border-gold/50 text-gold',
        priority === 'normal' && 'text-muted-foreground',
        className,
      )}
    >
      {priority !== 'normal' && <Icon className="size-3" aria-hidden="true" />}
      {priorityLabels[priority]}
    </span>
  )
}

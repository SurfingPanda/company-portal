import { statusIcons } from '@/components/forms/formMeta'
import { requestStatusLabels } from '@/data/requestCategories'
import { cn } from '@/lib/utils'
import type { RequestStatus as Status } from '@/types/request'

/** Restrained status badge: icon + text, so meaning never depends on colour. */
export function RequestStatus({ status, className }: { status: Status; className?: string }) {
  const Icon = statusIcons[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs font-medium',
        status === 'rejected' && 'border-destructive/40 text-destructive',
        status === 'cancelled' && 'text-muted-foreground',
        status === 'approved' && 'border-gold/50 text-gold',
        status === 'completed' && 'border-primary/40 text-primary',
        (status === 'submitted' || status === 'under-review' || status === 'draft') && 'bg-secondary text-foreground/80',
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {requestStatusLabels[status]}
    </span>
  )
}

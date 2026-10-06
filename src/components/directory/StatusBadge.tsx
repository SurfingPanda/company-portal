import { statusLabels } from '@/data/directoryOptions'
import { cn } from '@/lib/utils'
import type { EmployeeStatus } from '@/types/employee'

interface StatusBadgeProps {
  status: EmployeeStatus
  className?: string
}

/** Subtle text status. Only "On Leave" is flagged; "Active" is the unmarked default in lists. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider',
        status === 'on-leave' ? 'text-gold' : 'text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', status === 'on-leave' ? 'bg-amber-500' : 'bg-gold')} />
      {statusLabels[status]}
    </span>
  )
}

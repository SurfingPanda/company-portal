import { cn } from '@/lib/utils'
import type { JobStatus as Status } from '@/types/recruitment'

/** Job status as text with a marker; meaning never depends on colour alone. */
export function JobStatus({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-xs font-medium',
        status === 'Open' && 'border-gold/50 text-gold',
        status === 'Closing Soon' && 'border-primary/40 text-primary',
        (status === 'Closed' || status === 'Filled') && 'text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', status === 'Open' ? 'bg-gold' : status === 'Closing Soon' ? 'bg-primary' : 'bg-muted-foreground/50')} />
      {status}
    </span>
  )
}

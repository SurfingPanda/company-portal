import { cn } from '@/lib/utils'
import type { BenefitStatus as Status } from '@/types/benefit'

export const benefitStatusLabels: Record<Status, string> = {
  available: 'Available',
  'information-only': 'Information Only',
  'coming-soon': 'Coming Soon',
}

/** Restrained status label (text + marker). It never implies a benefit is active unless the data says "available". */
export function BenefitStatus({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-xs font-medium',
        status === 'available' && 'border-gold/50 text-gold',
        status === 'information-only' && 'border-primary/30 text-primary',
        status === 'coming-soon' && 'text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', status === 'available' ? 'bg-gold' : status === 'information-only' ? 'bg-primary' : 'bg-muted-foreground/50')} />
      {benefitStatusLabels[status]}
    </span>
  )
}

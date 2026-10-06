import { Ban, CheckCheck, CircleCheck, CircleDot, Hourglass, Wrench, type LucideIcon } from 'lucide-react'
import { ticketStatusLabels } from '@/data/helpdeskOptions'
import { cn } from '@/lib/utils'
import type { TicketStatus as Status } from '@/types/helpdesk'

const icons: Record<Status, LucideIcon> = {
  new: CircleDot,
  open: Wrench,
  pending: Hourglass,
  resolved: CircleCheck,
  closed: CheckCheck,
  cancelled: Ban,
}

/** Restrained status badge: icon plus text, so state never depends on colour alone. */
export function TicketStatus({ status, label, className }: { status: Status; label?: string; className?: string }) {
  const Icon = icons[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs font-medium',
        status === 'new' && 'bg-secondary text-foreground/80',
        status === 'open' && 'border-primary/40 text-primary',
        status === 'pending' && 'border-amber-600/50 text-amber-700',
        status === 'resolved' && 'border-gold/50 text-gold',
        status === 'closed' && 'text-muted-foreground',
        status === 'cancelled' && 'text-muted-foreground line-through decoration-muted-foreground/50',
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {label ?? ticketStatusLabels[status]}
    </span>
  )
}

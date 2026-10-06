import { ArrowDown, ArrowUp, Minus, TriangleAlert, type LucideIcon } from 'lucide-react'
import { ticketPriorityLabels } from '@/data/helpdeskOptions'
import { cn } from '@/lib/utils'
import type { TicketPriority as Priority } from '@/types/helpdesk'

const icons: Record<Priority, LucideIcon> = { low: ArrowDown, normal: Minus, high: ArrowUp, urgent: TriangleAlert }

/** Informational priority label (icon + text). It triggers nothing; the helpdesk system decides real priority. */
export function TicketPriority({ priority, className }: { priority: Priority; className?: string }) {
  const Icon = icons[priority]
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', priority === 'urgent' ? 'text-red-800' : priority === 'high' ? 'text-amber-700' : 'text-foreground/80', className)}>
      <Icon className="size-3" aria-hidden="true" />
      <span className="sr-only">Priority: </span>
      {ticketPriorityLabels[priority]}
    </span>
  )
}

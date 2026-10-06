import { Ban, CircleX, ClipboardCheck, Clock, FilePen, Handshake, Send, Star, Users, type LucideIcon } from 'lucide-react'
import { applicationStatusLabels } from '@/lib/recruitment'
import { cn } from '@/lib/utils'
import type { ApplicationStatus as Status } from '@/types/recruitment'

const icons: Record<Status, LucideIcon> = {
  draft: FilePen,
  submitted: Send,
  'under-review': Clock,
  shortlisted: Star,
  interview: Users,
  'for-assessment': ClipboardCheck,
  offer: Handshake,
  rejected: CircleX,
  withdrawn: Ban,
}

/** Icon + text status badge, so meaning never depends on colour. Stage names are examples only. */
export function ApplicationStatus({ status, className }: { status: Status; className?: string }) {
  const Icon = icons[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs font-medium',
        status === 'rejected' && 'border-destructive/40 text-destructive',
        status === 'withdrawn' && 'text-muted-foreground',
        (status === 'shortlisted' || status === 'interview' || status === 'for-assessment' || status === 'offer') && 'border-gold/50 text-gold',
        (status === 'draft' || status === 'submitted' || status === 'under-review') && 'bg-secondary text-foreground/80',
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {applicationStatusLabels[status]}
    </span>
  )
}

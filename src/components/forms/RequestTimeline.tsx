import { Circle, CircleCheck, CircleDot } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RequestTimelineEntry } from '@/types/request'

const stateText = { done: 'Completed step', current: 'Current step', pending: 'Pending step' } as const

/** Vertical timeline of request steps. Pending steps are shown as "Pending". */
export function RequestTimeline({ entries }: { entries: RequestTimelineEntry[] }) {
  return (
    <ol aria-label="Request timeline">
      {entries.map((entry, index) => {
        const Icon = entry.state === 'done' ? CircleCheck : entry.state === 'current' ? CircleDot : Circle
        const last = index === entries.length - 1
        return (
          <li key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!last && <span aria-hidden="true" className={cn('absolute left-[0.6875rem] top-6 bottom-0 w-px', entry.state === 'done' ? 'bg-primary/40' : 'bg-border')} />}
            <Icon
              className={cn('relative mt-0.5 size-[1.375rem] shrink-0 bg-white', entry.state === 'done' && 'text-gold', entry.state === 'current' && 'text-primary', entry.state === 'pending' && 'text-muted-foreground/50')}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className={cn('text-sm font-semibold', entry.state === 'pending' ? 'text-muted-foreground' : 'text-foreground')}>
                {entry.label}
                <span className="sr-only"> ({stateText[entry.state]})</span>
              </p>
              <p className="text-xs text-muted-foreground">{entry.timestamp ? formatDateTime(entry.timestamp) : 'Pending'}</p>
              {entry.description && <p className="mt-0.5 text-[0.8125rem] text-foreground/80">{entry.description}</p>}
              {entry.actor && <p className="text-xs text-muted-foreground">{entry.actor}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

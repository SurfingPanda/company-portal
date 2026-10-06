import { PlaceholderTag } from '@/components/company/ContentStatus'
import { cn } from '@/lib/utils'
import type { CompanyMilestone } from '@/types/company'

interface CompanyTimelineProps {
  milestones: CompanyMilestone[]
  /** Show only the first N entries (used for the overview preview). */
  limit?: number
}

/** Editorial timeline: year column, a thin rule and the entry. Stacks on mobile. */
export function CompanyTimeline({ milestones, limit }: CompanyTimelineProps) {
  const items = limit ? milestones.slice(0, limit) : milestones

  return (
    <ol className="border-t">
      {items.map((m) => (
        <li key={m.id} className="grid gap-1 border-b py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
          <p className={cn('text-sm font-semibold tabular-nums', m.year ? 'text-primary' : 'italic text-muted-foreground')}>
            {m.year ?? 'Year to be confirmed'}
          </p>
          <div className="min-w-0 sm:border-l sm:pl-6">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg font-semibold leading-snug text-primary">{m.title}</h3>
              {m.status === 'placeholder' && <PlaceholderTag />}
            </div>
            {m.description && (
              <p className={cn('mt-1 max-w-2xl text-sm', m.status === 'placeholder' ? 'italic text-muted-foreground' : 'text-foreground/80')}>
                {m.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

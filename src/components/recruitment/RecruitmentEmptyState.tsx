import { Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Action = { label: string; to: string } | { label: string; onClick: () => void }

/** "Nothing here" panel. Deliberately not styled as an error: missing data or configuration is not a failure. */
export function RecruitmentEmptyState({ title, message, action }: { title: string; message: string; action?: Action }) {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h2 className="font-serif text-xl font-semibold text-primary">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {action && (
        <div className="mt-5">
          {'to' in action ? (
            <Button asChild>
              <Link to={action.to}>{action.label}</Link>
            </Button>
          ) : (
            <Button variant="outline" className="bg-white" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function RecruitmentErrorState({ title = "We couldn't load recruitment information.", onRetry }: { title?: string; onRetry: () => void }) {
  return (
    <div className="border border-destructive/30 bg-white px-6 py-12 text-center" role="alert">
      <h2 className="font-serif text-xl font-semibold text-primary">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
      <Button className="mt-5" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

export function RecruitmentListSkeleton({ rows = 5, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className="divide-y border bg-white">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2 px-4 py-4">
          <Skeleton className="h-4 w-60 max-w-full rounded-sm" />
          <Skeleton className="h-3 w-80 max-w-full rounded-sm" />
          <Skeleton className="h-3 w-40 rounded-sm" />
        </div>
      ))}
    </div>
  )
}

export function RecruitmentNotice({ children, className, strong = 'Sample / Demo Data.' }: { children: React.ReactNode; className?: string; strong?: string }) {
  return (
    <div role="note" className={cn('flex items-start gap-3 border border-dashed border-muted-foreground/40 bg-white px-4 py-3 text-sm', className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-foreground/80">
        <span className="font-semibold text-foreground">{strong}</span> {children}
      </p>
    </div>
  )
}

export const SAMPLE_JOBS_NOTICE = 'These job openings are demonstration records, not actual ELJIN vacancies. They will be replaced with HR-approved recruitment data.'

export function RecruitmentSection({ id, title, action, children }: { id: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <div className="flex items-end justify-between gap-3 border-b-2 border-primary pb-2">
        <h2 id={id} className="font-serif text-xl font-semibold text-primary">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

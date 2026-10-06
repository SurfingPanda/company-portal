import { Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function HRErrorState({ title = "We couldn't load this HR information.", onRetry }: { title?: string; onRetry: () => void }) {
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

/** Plain "nothing here" panel. Deliberately not styled as an error. */
export function HREmptyState({ title, message, action }: { title: string; message: string; action?: { label: string; to: string } | { label: string; onClick: () => void } }) {
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

export function HRListSkeleton({ rows = 5, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className="divide-y border bg-white">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2 px-4 py-4">
          <Skeleton className="h-3 w-28 rounded-sm" />
          <Skeleton className="h-4 w-72 max-w-full rounded-sm" />
          <Skeleton className="h-3 w-48 rounded-sm" />
        </div>
      ))}
    </div>
  )
}

export function HRCardsSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Loading HR services" aria-busy="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Loading HR services…</span>
      {Array.from({ length: cards }, (_, i) => (
        <Skeleton key={i} className="h-36 rounded-sm" />
      ))}
    </div>
  )
}

export function SampleHRNotice({ className, text }: { className?: string; text?: string }) {
  return (
    <div role="note" className={cn('flex items-start gap-3 border border-dashed border-muted-foreground/40 bg-white px-4 py-3 text-sm', className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-foreground/80">
        <span className="font-semibold text-foreground">Sample / Portal Demo Data.</span>{' '}
        {text ?? 'Services, requests and information here are fictional development examples, not official ELJIN HR data. Nothing is sent to HR.'}
      </p>
    </div>
  )
}

export function HRSection({ id, title, action, children }: { id: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
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

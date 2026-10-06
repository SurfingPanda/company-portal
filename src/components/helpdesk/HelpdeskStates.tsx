import { Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function HelpdeskErrorState({ title = "We couldn't load your IT support information.", onRetry }: { title?: string; onRetry: () => void }) {
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

export function TicketsEmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h2 className="font-serif text-xl font-semibold text-primary">No tickets found.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Try changing your filters or submit a new request.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onClear && (
          <Button variant="outline" className="bg-white" onClick={onClear}>
            Clear Filters
          </Button>
        )}
        <Button asChild>
          <Link to="/helpdesk/new">Submit a Request</Link>
        </Button>
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 6, label = 'Loading tickets' }: { rows?: number; label?: string }) {
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

export function SampleHelpdeskNotice({ className, text }: { className?: string; text?: string }) {
  return (
    <div role="note" className={cn('flex items-start gap-3 border border-dashed border-muted-foreground/40 bg-white px-4 py-3 text-sm', className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-foreground/80">
        <span className="font-semibold text-foreground">Sample content.</span>{' '}
        {text ?? 'Tickets and help articles here are fictional development examples, not real IT records or official Eljin procedures. Nothing is sent to a ticketing system.'}
      </p>
    </div>
  )
}

import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SampleEventsNotice({ className }: { className?: string }) {
  return (
    <div role="note" className={cn('flex items-start gap-3 border border-dashed border-muted-foreground/40 bg-white px-4 py-3 text-sm', className)}>
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-foreground/80">
        <span className="font-semibold text-foreground">Sample events.</span> The events, holidays and deadlines shown here are
        development examples. They are not official Eljin Corporation events.
      </p>
    </div>
  )
}

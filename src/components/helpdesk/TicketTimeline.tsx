import { CircleDot, MessageSquare, UserRound } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TicketActivity } from '@/types/helpdesk'

/** Chronological ticket activity: status events and replies. Timestamps are formatted from stored values. */
export function TicketTimeline({ entries }: { entries: TicketActivity[] }) {
  const ordered = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  return (
    <ol aria-label="Ticket activity">
      {ordered.map((entry, index) => {
        const Icon = entry.kind === 'reply' ? MessageSquare : entry.actor === 'employee' ? UserRound : CircleDot
        const last = index === ordered.length - 1
        return (
          <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span aria-hidden="true" className="absolute left-[0.6875rem] top-6 bottom-0 w-px bg-border" />}
            <Icon className="relative mt-0.5 size-[1.375rem] shrink-0 bg-white text-primary" strokeWidth={1.5} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
                <span className="mx-1.5">·</span>
                <span className="font-medium text-foreground/80">{entry.actorLabel}</span>
              </p>
              {entry.kind === 'reply' ? (
                <p className={cn('mt-1 whitespace-pre-line break-words border bg-white px-3 py-2 text-sm', entry.actor === 'employee' && 'border-primary/30 bg-accent/40')}>{entry.message}</p>
              ) : (
                <p className="mt-0.5 text-sm font-medium text-foreground">{entry.message}</p>
              )}
              {entry.attachments?.map((a) => (
                <p key={a.id} className="mt-1 text-xs text-muted-foreground">
                  Attachment: {a.name} ({a.fileType})
                </p>
              ))}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

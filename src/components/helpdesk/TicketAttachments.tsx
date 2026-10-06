import { Paperclip } from 'lucide-react'
import type { TicketAttachment } from '@/types/helpdesk'

const formatSize = (bytes?: number) => (bytes === undefined ? undefined : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`)

/** Attachments already on a ticket. Names only: no download is available until file storage exists. */
export function TicketAttachments({ attachments }: { attachments: TicketAttachment[] }) {
  if (attachments.length === 0) return <p className="text-sm text-muted-foreground">No attachments.</p>

  return (
    <>
      <ul className="divide-y border bg-white">
        {attachments.map((a) => (
          <li key={a.id} className="flex items-center gap-2 px-3 py-2.5 text-sm">
            <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {a.fileType}
              {formatSize(a.size) && ` · ${formatSize(a.size)}`}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs text-muted-foreground">Sample attachment (mock). Files are not stored or downloadable yet.</p>
    </>
  )
}

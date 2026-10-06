import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContentStatus } from '@/types/company'

/** True when any item is still temporary development content. */
export const hasPlaceholder = (...groups: ({ status: ContentStatus } | { status: ContentStatus }[] | undefined)[]) =>
  groups.flat().some((item) => item?.status === 'placeholder')

/** Small tag marking content that is not yet official company information. */
export function PlaceholderTag({ className, children = 'Placeholder' }: { className?: string; children?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center border border-dashed border-muted-foreground/50 px-1.5 py-px text-[0.625rem] font-semibold uppercase tracking-widest text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Page-level notice explaining that the content on the page is temporary. */
export function PlaceholderNotice({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn('flex items-start gap-3 border border-dashed border-muted-foreground/40 bg-white px-4 py-3 text-sm', className)}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-foreground/80">
        <span className="font-semibold text-foreground">Official company information pending.</span> Items marked{' '}
        <PlaceholderTag className="align-middle" /> are temporary development content and will be replaced by approved
        content from Eljin Corporation.
      </p>
    </div>
  )
}

/** Text that is visually distinct when it is placeholder content. */
export function StatusText({ text, status, className }: { text: string; status: ContentStatus; className?: string }) {
  return (
    <p className={cn(status === 'placeholder' && 'italic text-muted-foreground', className)}>{text}</p>
  )
}

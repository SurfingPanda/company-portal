import { formatFullTimestamp, formatRelativeTime } from '@/lib/relativeTime'

/** Time display calculated from the stored timestamp. Screen readers also get the full date and time. */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  return (
    <time dateTime={iso} title={formatFullTimestamp(iso)} className={className}>
      {formatRelativeTime(iso)}
      <span className="sr-only"> ({formatFullTimestamp(iso)})</span>
    </time>
  )
}

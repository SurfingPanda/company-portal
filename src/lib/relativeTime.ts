import { formatDate, formatDateTime } from '@/lib/format'

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
const DAY_MS = 24 * 60 * 60 * 1000

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`

/**
 * Display text for a timestamp: "Just now", "5 minutes ago", "2 hours ago", "Yesterday", then "Sep 28, 2026".
 * Pass `now` to make the result deterministic (useful for tests).
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso)
  const diffMs = now.getTime() - then.getTime()

  if (diffMs < 0) return formatDate(iso) // future timestamps: show the date
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return plural(minutes, 'minute')

  const daysApart = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS)
  if (daysApart === 0) return plural(Math.floor(minutes / 60), 'hour')
  if (daysApart === 1) return 'Yesterday'
  return formatDate(iso)
}

/** Full date and time, for tooltips and screen readers. */
export const formatFullTimestamp = (iso: string) => formatDateTime(iso)

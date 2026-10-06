const shortFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const longFormat = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

/** Formats an ISO date (YYYY-MM-DD) without timezone shifts. */
export function formatDate(iso: string, style: 'short' | 'long' = 'short') {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  return (style === 'short' ? shortFormat : longFormat).format(date)
}

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

/** Formats an ISO date-time (YYYY-MM-DDTHH:mm:ss) as "Oct 1, 2026, 9:15 AM". */
export function formatDateTime(isoDateTime: string) {
  const date = new Date(isoDateTime)
  return `${shortFormat.format(date)}, ${timeFormat.format(date)}`
}

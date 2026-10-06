/** Time-based greeting from the browser's local time. No time zone is hard-coded. */
export function getGreeting(date: Date = new Date()): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** "Wednesday, October 1" in the browser's locale and local date. */
export function formatToday(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date)
}

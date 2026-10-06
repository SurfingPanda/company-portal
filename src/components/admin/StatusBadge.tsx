import { cn } from '@/lib/utils'

type Tone = 'good' | 'warn' | 'bad' | 'neutral' | 'info'

/** Status word -> tone. Unknown words are neutral. The word itself is always shown, so colour is never the only signal. */
const TONES: Record<string, Tone> = {
  active: 'good', published: 'good', open: 'good', available: 'good', approved: 'good', completed: 'good', resolved: 'good', success: 'good', scheduled: 'good',
  pending: 'warn', draft: 'warn', submitted: 'info', 'under-review': 'info', new: 'info', postponed: 'warn', 'closing-soon': 'warn', 'information-only': 'info',
  inactive: 'neutral', archived: 'neutral', closed: 'neutral', cancelled: 'neutral', filled: 'neutral', 'coming-soon': 'neutral',
  suspended: 'bad', rejected: 'bad', denied: 'bad', failed: 'bad',
}

const STYLES: Record<Tone, string> = {
  good: 'border-emerald-700/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  warn: 'border-amber-700/40 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  bad: 'border-red-700/40 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200',
  info: 'border-primary/30 bg-primary/5 text-primary',
  neutral: 'border-border bg-muted text-muted-foreground',
}

const DOTS: Record<Tone, string> = { good: '●', warn: '▲', bad: '■', info: '◆', neutral: '○' }

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const tone = TONES[value] ?? 'neutral'
  return (
    <span className={cn('inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-medium capitalize', STYLES[tone])}>
      <span aria-hidden="true" className="text-[0.55rem]">{DOTS[tone]}</span>
      {label ?? value.replace(/-/g, ' ')}
    </span>
  )
}

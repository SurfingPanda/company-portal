import { Cake, PartyPopper } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionHeading } from '@/components/common/SectionHeading'
import { SectionError } from '@/components/dashboard/SectionBoundary'
import { useAuthorization } from '@/auth/useAuthorization'
import { useAsync } from '@/hooks/useAsync'
import { getCelebrations } from '@/services/celebrationService'
import { isApiMode } from '@/services/dataMode'
import type { Celebration } from '@/types/celebration'

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
/** "Oct 10": a day and month only, never a year. */
const day = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00`))

function Row({ item, kind }: { item: Celebration; kind: 'birthday' | 'anniversary' }) {
  const Icon = kind === 'birthday' ? Cake : PartyPopper
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
      <div className="min-w-0 text-sm">
        <Link to={`/directory/${encodeURIComponent(item.employee_id)}`} className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
          {item.is_you ? 'You' : item.display_name}
        </Link>
        <span className="text-muted-foreground">
          {' · '}
          {kind === 'birthday' ? 'Birthday' : `${item.years} ${item.years === 1 ? 'year' : 'years'} with the company`}
          {item.department ? ` · ${item.department}` : ''}
        </span>
      </div>
      <span className={item.is_today ? 'ml-auto shrink-0 rounded-sm bg-gold/20 px-1.5 py-0.5 text-xs font-semibold text-primary' : 'ml-auto shrink-0 text-xs text-muted-foreground'}>
        {item.is_today ? 'Today' : day(item.date)}
      </span>
    </li>
  )
}

/**
 * Birthdays and work anniversaries in the next 30 days. A birthday appears only for people who chose to share it, as a day and
 * month; an anniversary comes from HR's date joined unless the person turned it off. Hidden when there is nothing to celebrate.
 */
export function Celebrations() {
  const { hasPermission } = useAuthorization()
  const enabled = isApiMode && hasPermission('directory.view')
  const { data, error, retry } = useAsync(() => (enabled ? getCelebrations() : Promise.resolve(null)), [enabled])

  if (!enabled) return null
  if (error) {
    return (
      <section aria-labelledby="celebrations-heading">
        <SectionHeading id="celebrations-heading" title="Celebrations" />
        <SectionError onRetry={retry} />
      </section>
    )
  }
  if (!data || (data.birthdays.length === 0 && data.anniversaries.length === 0)) return null

  return (
    <section aria-labelledby="celebrations-heading">
      <SectionHeading id="celebrations-heading" title="Celebrations" description="Birthdays and work anniversaries in the next 30 days." />
      {data.birthdays.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Birthdays</h3>
          <ul className="mb-4 divide-y border-y bg-white px-3">
            {data.birthdays.slice(0, 6).map((b) => <Row key={`b-${b.employee_id}`} item={b} kind="birthday" />)}
          </ul>
        </>
      )}
      {data.anniversaries.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work anniversaries</h3>
          <ul className="divide-y border-y bg-white px-3">
            {data.anniversaries.slice(0, 6).map((a) => <Row key={`a-${a.employee_id}`} item={a} kind="anniversary" />)}
          </ul>
        </>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Birthdays are shown only for people who chose to share them (day and month only).{' '}
        <Link to="/profile/personal" className="text-primary underline-offset-4 hover:underline">Choose what you share</Link>
      </p>
    </section>
  )
}

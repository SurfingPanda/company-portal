import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { PENDING_TEXT } from '@/data/companyData'
import { cn } from '@/lib/utils'
import type { Department } from '@/types/company'

interface DepartmentCardProps {
  department: Department
  /** Name and link only (used in the overview). */
  compact?: boolean
}

/** One department entry. Links to the Employee Directory filtered by that department. */
export function DepartmentCard({ department, compact = false }: DepartmentCardProps) {
  const placeholder = department.status === 'placeholder'
  const directoryHref = department.directoryFilter
    ? `/directory?department=${encodeURIComponent(department.directoryFilter)}`
    : undefined

  if (compact) {
    return (
      <div className="flex h-full items-center justify-between gap-2 p-3">
        <h3 className="text-sm font-semibold text-primary">{department.name}</h3>
        {directoryHref && (
          <Link to={directoryHref} aria-label={`View ${department.name} in the directory`} className="text-muted-foreground hover:text-gold focus-visible:outline-2 focus-visible:outline-ring">
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    )
  }

  return (
    <article className="flex h-full flex-col p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-serif text-xl font-semibold leading-tight text-primary">{department.name}</h3>
        {placeholder && <PlaceholderTag />}
      </div>
      <p className={cn('mt-2 text-sm leading-relaxed', placeholder ? 'italic text-muted-foreground' : 'text-foreground/80')}>
        {department.description}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-4 border-t pt-3 text-sm">
        <div>
          <dt className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">Department Head</dt>
          <dd className={cn('mt-0.5', !department.head && 'text-xs italic text-muted-foreground')}>{department.head ?? PENDING_TEXT}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">Employees</dt>
          <dd className={cn('mt-0.5', department.employeeCount === undefined && 'text-xs italic text-muted-foreground')}>
            {department.employeeCount ?? 'To be provided'}
          </dd>
        </div>
      </dl>
      {directoryHref && (
        <Link
          to={directoryHref}
          className="mt-4 inline-flex items-center gap-0.5 self-start text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          View Department <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </article>
  )
}

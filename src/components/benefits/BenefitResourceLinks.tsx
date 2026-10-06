import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HREmptyState, HRErrorState, HRListSkeleton } from '@/components/hr/HRStates'
import { useAsync } from '@/hooks/useAsync'
import { getBenefitResources } from '@/services/benefitService'

const rowClass =
  'group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

/** Employee Resources: links into the existing Documents, Forms and HR modules. */
export function BenefitResourceLinks() {
  const { data, error, retry } = useAsync(getBenefitResources, [])

  if (error) return <HRErrorState onRetry={retry} />
  if (!data) return <HRListSkeleton rows={3} label="Loading resources" />
  if (data.length === 0) return <HREmptyState title="No resources yet" message="Benefits resources have not yet been published." />

  return (
    <ul aria-label="Employee resources" className="grid divide-y border bg-white sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3 [&>li]:sm:border-b [&>li]:sm:border-r">
      {data.map((r) => (
        <li key={r.id}>
          {r.href ? (
            <Link to={r.href} className={rowClass}>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-primary group-hover:underline">{r.label}</span>
                <span className="block text-xs text-muted-foreground">{r.description}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          ) : (
            <div className="px-4 py-3">
              <span className="block text-sm font-semibold text-muted-foreground">{r.label}</span>
              <span className="block text-xs text-muted-foreground">{r.description}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

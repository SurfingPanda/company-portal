import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HREmptyState, HRErrorState, HRListSkeleton } from '@/components/hr/HRStates'
import { useAsync } from '@/hooks/useAsync'
import { getHRResources } from '@/services/hrService'

/** Links into the Documents and Forms modules. HR keeps no separate document storage. */
export function HRResourceLinks() {
  const { data, error, retry } = useAsync(getHRResources, [])

  if (error) return <HRErrorState onRetry={retry} />
  if (!data) return <HRListSkeleton rows={3} label="Loading HR resources" />
  if (data.length === 0) return <HREmptyState title="No HR resources yet" message="HR resources have not yet been published." />

  return (
    <ul aria-label="HR resources" className="divide-y border bg-white">
      {data.map((link) => (
        <li key={link.id}>
          <Link
            to={link.href}
            className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-primary group-hover:underline">{link.label}</span>
              <span className="block text-xs text-muted-foreground">{link.description}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

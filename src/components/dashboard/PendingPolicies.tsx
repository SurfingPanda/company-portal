import { ArrowRight, ScrollText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthorization } from '@/auth/useAuthorization'
import { useAsync } from '@/hooks/useAsync'
import { getMyPolicies } from '@/services/policyService'

/** A prompt on the dashboard while there are policies to read. Shows nothing when there are none (or the list cannot load). */
export function PendingPolicies() {
  const { hasPermission } = useAuthorization()
  const { data } = useAsync(() => (hasPermission('policies.view') ? getMyPolicies('pending') : Promise.resolve({ policies: [], pending: 0 })), [])
  if (!data || data.policies.length === 0) return null

  const overdue = data.policies.filter((p) => p.status === 'overdue').length
  return (
    <section aria-labelledby="pending-policies-heading" className="border border-l-4 border-l-amber-600 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ScrollText className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <h2 id="pending-policies-heading" className="font-serif text-lg font-semibold text-primary">
              {data.pending} {data.pending === 1 ? 'policy' : 'policies'} to read
            </h2>
            <p className="text-sm text-muted-foreground">
              {overdue > 0 ? `${overdue} past the due date. ` : ''}Please read {data.pending === 1 ? 'it' : 'them'} and confirm.
            </p>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {data.policies.slice(0, 3).map((p) => (
                <li key={p.id}><Link to={`/policies/${p.id}`} className="text-primary underline-offset-4 hover:underline">{p.title}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <Link to="/policies" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
          Open policies <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

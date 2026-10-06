import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/format'
import { policyStatusLabel, policyStatusTone } from '@/lib/policies'
import { getMyPolicies } from '@/services/policyService'

type Tab = 'all' | 'pending' | 'acknowledged'
const TABS: { value: Tab; label: string }[] = [
  { value: 'pending', label: 'To read' },
  { value: 'acknowledged', label: 'Read' },
  { value: 'all', label: 'All' },
]

/** Company policies for the signed-in employee: what to read first, and what they have already confirmed. */
export default function PoliciesPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const { data, error, loading, retry } = useAsync(() => getMyPolicies(tab === 'all' ? undefined : tab), [tab])

  return (
    <PageContainer className="pb-16">
      <PageHeader title="Policies" description="Company policies you need to read. Confirm each one once you have read it." breadcrumbs={[{ label: 'Policies' }]} />

      <div role="tablist" aria-label="Show" className="mt-6 flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring ${tab === t.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary'}`}
          >
            {t.label}
            {t.value === 'pending' && data && data.pending > 0 && <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[0.6875rem] text-primary-foreground">{data.pending}</span>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error ? (
          <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive">Unable to load policies.</p>
            <Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button>
          </div>
        ) : !data && loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading policies">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : data && data.policies.length === 0 ? (
          <p role="status" className="border border-dashed border-muted-foreground/40 bg-white p-6 text-sm text-muted-foreground">
            {tab === 'pending' ? 'Nothing to read right now. You are up to date.' : tab === 'acknowledged' ? 'You have not confirmed any policy yet.' : 'No policies have been published for you yet.'}
          </p>
        ) : (
          <ul className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
            {data?.policies.map((p) => (
              <li key={p.id} className="border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg font-semibold leading-tight text-primary">
                      <Link to={`/policies/${p.id}`} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{p.title}</Link>
                    </h2>
                    {p.summary && <p className="mt-1 text-sm text-foreground/85">{p.summary}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Version {p.version}
                      {p.effective_date && ` · Effective ${formatDate(p.effective_date, 'long')}`}
                      {p.status === 'acknowledged' && p.acknowledged_at ? ` · Read on ${formatDate(p.acknowledged_at, 'long')}` : p.due_date ? ` · Please read by ${formatDate(p.due_date, 'long')}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge value={policyStatusTone(p.status)} label={policyStatusLabel(p)} />
                    <Button asChild size="sm" variant={p.status === 'acknowledged' ? 'outline' : 'default'} className={p.status === 'acknowledged' ? 'bg-white' : undefined}>
                      <Link to={`/policies/${p.id}`}>{p.status === 'acknowledged' ? 'View' : 'Read'}</Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  )
}

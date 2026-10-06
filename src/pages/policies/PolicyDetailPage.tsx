import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { formatDate } from '@/lib/format'
import { policyStatusLabel, policyStatusTone } from '@/lib/policies'
import { acknowledgePolicy, getPolicy } from '@/services/policyService'
import type { PolicyDetail } from '@/types/policy'

/** One policy: read it, then confirm. Confirming is recorded against the version shown on this page. */
export default function PolicyDetailPage() {
  const { policyId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getPolicy(policyId), [policyId])
  const [confirmed, setConfirmed] = useState(false)
  const [done, setDone] = useState<PolicyDetail | null>(null)
  const save = useMutation((policy: PolicyDetail) => acknowledgePolicy(policy.id, policy.version))

  const policy = done ?? data
  const submit = async () => {
    if (!data || !confirmed) return
    const updated = await save.mutate(data)
    if (updated) setDone(updated)
  }

  return (
    <PageContainer className="pb-16">
      <PageHeader title={policy?.title ?? 'Policy'} description={policy?.summary ?? undefined} breadcrumbs={[{ label: 'Policies', href: '/policies' }, { label: policy?.title ?? 'Policy' }]} />

      {error ? (
        <div role="alert" className="mt-6 border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">We could not find this policy.</p>
          <p className="mt-1 text-muted-foreground">It may have been withdrawn, or it is not meant for you.</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" size="sm" className="bg-white" onClick={retry}>Try again</Button>
            <Button asChild size="sm"><Link to="/policies">Back to policies</Link></Button>
          </div>
        </div>
      ) : !policy && loading ? (
        <Skeleton className="mt-6 h-96" />
      ) : policy ? (
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2" aria-label={policy.title}>
            <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <StatusBadge value={policyStatusTone(policy.status)} label={policyStatusLabel(policy)} />
              <span>Version {policy.version}</span>
              {policy.effective_date && <span>Effective {formatDate(policy.effective_date, 'long')}</span>}
              {policy.updated_at && <span>Published {formatDate(policy.updated_at, 'long')}</span>}
            </p>
            {policy.previously_acknowledged_version && policy.status !== 'acknowledged' && (
              <p role="note" className="mb-4 border border-amber-700/40 bg-amber-50 p-3 text-sm text-amber-900">
                This policy was updated since you read version {policy.previously_acknowledged_version}. Please read it again.
              </p>
            )}
            <div className="whitespace-pre-line border bg-white p-6 text-[0.9375rem] leading-relaxed">{policy.body}</div>
          </article>

          <aside className="lg:col-span-1">
            <section aria-labelledby="ack-heading" className="border border-l-4 border-l-primary bg-white p-5 lg:sticky lg:top-6">
              <h2 id="ack-heading" className="font-serif text-lg font-semibold text-primary">Your confirmation</h2>
              {policy.status === 'acknowledged' ? (
                <p role="status" className="mt-3 flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span>You confirmed reading this policy (version {policy.version}){policy.acknowledged_at ? ` on ${formatDate(policy.acknowledged_at, 'long')}` : ''}.</span>
                </p>
              ) : (
                <>
                  {policy.due_date && <p className="mt-2 text-sm text-muted-foreground">Please read by <strong>{formatDate(policy.due_date, 'long')}</strong>.</p>}
                  <label className="mt-4 flex items-start gap-2 text-sm">
                    <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(c === true)} disabled={save.submitting} className="mt-0.5" />
                    <span>I have read and understood this policy (version {policy.version}).</span>
                  </label>
                  {(save.fieldErrors.version || save.fieldErrors.confirm || save.error) && (
                    <p role="alert" className="mt-3 text-sm font-medium text-destructive">{save.fieldErrors.version ?? save.fieldErrors.confirm ?? save.error}</p>
                  )}
                  <Button type="button" className="mt-4 w-full" disabled={!confirmed || save.submitting} onClick={() => void submit()}>
                    {save.submitting ? 'Saving…' : 'Confirm I have read it'}
                  </Button>
                  {save.fieldErrors.version && <Button type="button" variant="outline" className="mt-2 w-full bg-white" onClick={() => window.location.reload()}>Reload the policy</Button>}
                  <p className="mt-3 text-xs text-muted-foreground">Your confirmation and the date are recorded and visible to HR.</p>
                </>
              )}
              <Button asChild variant="outline" className="mt-4 w-full bg-white"><Link to="/policies">Back to all policies</Link></Button>
            </section>
          </aside>
        </div>
      ) : null}
    </PageContainer>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { AdminCrudListPage } from '@/pages/admin/crud/AdminCrudListPage'
import { approvalRoutesConfig, directoryEntryOptions } from '@/pages/admin/hr/hrConfigs'
import { adminApi } from '@/services/admin/adminApi'

interface Approver { directory_entry_id: number; name: string; employee_id: string; can_act: boolean }
interface Fallback { primary: Approver | null; secondary: Approver | null }

const Status = ({ approver }: { approver: Approver | null }) =>
  approver === null ? null : approver.can_act ? <StatusBadge value="active" label="Can review" /> : <StatusBadge value="pending" label="Cannot review yet: needs the manager role and an active linked account" />

/**
 * The company-wide fallback approver, shown under the approval routes. It applies when a request's department has no head or route
 * that can act (for example a department without a manager), or when the department's approver is the requester.
 */
function FallbackPanel() {
  const { data, error, loading, retry } = useAsync(() => adminApi.get<Fallback>('/api/admin/hr/approval-fallback'), [])
  const options = useAsync(directoryEntryOptions, [])
  const [primary, setPrimary] = useState('')
  const [secondary, setSecondary] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!data) return
    setPrimary(data.primary ? String(data.primary.directory_entry_id) : '')
    setSecondary(data.secondary ? String(data.secondary.directory_entry_id) : '')
  }, [data])

  const save = useMutation((body: { primary_directory_entry_id: number | null; secondary_directory_entry_id: number | null }) => adminApi.update<Fallback>('/api/admin/hr/approval-fallback', body))
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaved(false)
    if (await save.mutate({ primary_directory_entry_id: primary ? Number(primary) : null, secondary_directory_entry_id: secondary ? Number(secondary) : null })) {
      setSaved(true)
      retry()
    }
  }

  const choices = options.data ?? []
  const select = (id: string, value: string, set: (v: string) => void, none: string) => (
    <select id={id} value={value} onChange={(e) => set(e.target.value)} disabled={save.submitting} className="h-10 w-full border border-input bg-white px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring">
      <option value="">{none}</option>
      {choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
    </select>
  )

  return (
    <section aria-labelledby="fallback-h" className="mt-10 max-w-3xl">
      <h2 id="fallback-h" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Fallback approver</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Requests go here last: when there is no route, no manager up the reporting line who can act, and no department head who can act, or when the approver is the one asking.
        The approver needs a linked portal account and the manager role (assigned under Users). Nobody approves their own request, so set a secondary for when the primary is the requester.
      </p>
      {error ? (
        <div role="alert" className="mt-3 border border-destructive/40 bg-destructive/5 p-3 text-sm"><p className="font-semibold text-destructive">Unable to load the fallback approver.</p><Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button></div>
      ) : loading ? <Skeleton className="mt-3 h-32" /> : (
        <form onSubmit={submit} noValidate aria-label="Fallback approver" className="mt-3 space-y-4 border bg-white p-5">
          {saved && <p role="status" className="border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">Fallback approver saved.</p>}
          {save.error && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{save.fieldErrors.primary_directory_entry_id ?? save.fieldErrors.secondary_directory_entry_id ?? save.error}</p>}
          <div>
            <label htmlFor="fb-primary" className="mb-1.5 block text-sm font-medium">Primary fallback approver</label>
            {select('fb-primary', primary, setPrimary, 'None (requests with no department approver reach nobody)')}
            <p className="mt-1 text-xs"><Status approver={data?.primary ?? null} /></p>
          </div>
          <div>
            <label htmlFor="fb-secondary" className="mb-1.5 block text-sm font-medium">Secondary fallback approver (optional)</label>
            {select('fb-secondary', secondary, setSecondary, 'None')}
            <p className="mt-1 text-xs"><Status approver={data?.secondary ?? null} /></p>
          </div>
          <Button type="submit" disabled={save.submitting}>{save.submitting ? 'Saving…' : 'Save fallback approver'}</Button>
        </form>
      )}
    </section>
  )
}

export default function ApprovalRoutingPage() {
  return (
    <>
      <AdminCrudListPage config={approvalRoutesConfig} />
      <FallbackPanel />
    </>
  )
}

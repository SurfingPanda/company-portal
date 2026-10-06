import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { adminApi } from '@/services/admin/adminApi'
import { createPolicy, getAdminPolicy, publishNewVersion, updatePolicy, type PolicyInput } from '@/services/policyService'
import type { AdminRecord } from '@/types/admin'
import type { AdminPolicy } from '@/types/policy'

const EMPTY: PolicyInput = { title: '', summary: '', body: '', audience: 'all', department_ids: [], effective_date: '', due_date: '', status: 'draft' }
const label = 'mb-1.5 block text-sm font-medium'
const field = 'w-full border border-input bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring'

const toInput = (p: AdminPolicy): PolicyInput => ({
  title: p.title, summary: p.summary ?? '', body: p.body, audience: p.audience, department_ids: p.department_ids,
  effective_date: p.effective_date ?? '', due_date: p.due_date ?? '', status: p.status,
})

function Form({ policy }: { policy: AdminPolicy | null }) {
  const navigate = useNavigate()
  const [values, setValues] = useState<PolicyInput>(policy ? toInput(policy) : EMPTY)
  const [confirmVersion, setConfirmVersion] = useState(false)
  const departments = useAsync(async () => (await adminApi.list<AdminRecord>('/api/admin/hr/departments', { per_page: 100, sort: 'name', direction: 'asc' })).data, [])
  const set = <K extends keyof PolicyInput>(key: K, value: PolicyInput[K]) => setValues((v) => ({ ...v, [key]: value }))
  const body = (): PolicyInput => ({ ...values, summary: values.summary || null, effective_date: values.effective_date || null, due_date: values.due_date || null, department_ids: values.audience === 'departments' ? values.department_ids : [] })

  const save = useMutation(async (andNewVersion: boolean) => {
    const saved = policy ? await updatePolicy(policy.id, body()) : await createPolicy(body())
    if (andNewVersion) await publishNewVersion(saved.id, { due_date: values.due_date || null })
    return saved
  })

  const submit = async (e?: FormEvent, andNewVersion = false) => {
    e?.preventDefault()
    const saved = await save.mutate(andNewVersion)
    setConfirmVersion(false)
    if (saved) navigate('/admin/policies', { state: { saved: saved.title } })
  }

  const published = policy?.status === 'published'
  const err = save.fieldErrors

  return (
    <>
      <AdminPageHeader
        title={policy ? 'Edit policy' : 'New policy'}
        trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Policies', href: '/admin/policies' }, { label: policy ? policy.title : 'New' }]}
      />
      <form onSubmit={(e) => void submit(e)} noValidate aria-label="Policy" className="max-w-3xl space-y-5 border bg-white p-5 sm:p-6">
        {save.error && Object.keys(err).length === 0 && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{save.error}</p>}
        {published && (
          <p role="note" className="border border-dashed border-muted-foreground/40 p-3 text-xs text-muted-foreground">
            This policy is live (version {policy.version}). <strong>Save</strong> fixes it in place and nobody is asked again. Use <strong>Save and publish as new version</strong> when the content changed and everyone must read it again.
          </p>
        )}

        <div>
          <label htmlFor="pol-title" className={label}>Title</label>
          <Input id="pol-title" value={values.title} maxLength={255} onChange={(e) => set('title', e.target.value)} aria-invalid={Boolean(err.title)} className="h-10 bg-white" />
          {err.title && <p className="mt-1 text-sm text-destructive">{err.title}</p>}
        </div>
        <div>
          <label htmlFor="pol-summary" className={label}>Short summary <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Input id="pol-summary" value={values.summary ?? ''} maxLength={1000} onChange={(e) => set('summary', e.target.value)} className="h-10 bg-white" />
          <p className="mt-1 text-xs text-muted-foreground">One or two sentences shown in the list.</p>
        </div>
        <div>
          <label htmlFor="pol-body" className={label}>Policy text</label>
          <Textarea id="pol-body" rows={16} value={values.body} onChange={(e) => set('body', e.target.value)} aria-invalid={Boolean(err.body)} className={field} />
          {err.body && <p className="mt-1 text-sm text-destructive">{err.body}</p>}
          <p className="mt-1 text-xs text-muted-foreground">Plain text. Blank lines separate paragraphs.</p>
        </div>

        <fieldset>
          <legend className={label}>Who must read it</legend>
          <div className="flex flex-wrap gap-2">
            {([['all', 'All employees'], ['managers', 'Managers'], ['departments', 'Chosen departments']] as const).map(([value, text]) => (
              <label key={value} className={`flex cursor-pointer items-center gap-2 border px-3 py-1.5 text-sm ${values.audience === value ? 'border-primary font-semibold text-primary' : 'bg-white text-foreground/80'}`}>
                <input type="radio" name="audience" value={value} checked={values.audience === value} onChange={() => set('audience', value)} className="size-3.5 accent-[var(--primary)]" />
                {text}
              </label>
            ))}
          </div>
          {values.audience === 'departments' && (
            <div className="mt-3">
              {departments.loading && !departments.data ? <Skeleton className="h-16" /> : (
                <ul className="grid gap-1 sm:grid-cols-2">
                  {departments.data?.map((d) => {
                    const id = Number(d.id)
                    return (
                      <li key={id}>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={values.department_ids.includes(id)} onCheckedChange={(c) => set('department_ids', c === true ? [...values.department_ids, id] : values.department_ids.filter((x) => x !== id))} />
                          {String(d.name)}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
              {(err.department_ids) && <p className="mt-1 text-sm text-destructive">{err.department_ids}</p>}
            </div>
          )}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="pol-effective" className={label}>Effective from</label>
            <Input id="pol-effective" type="date" value={values.effective_date ?? ''} onChange={(e) => set('effective_date', e.target.value)} className="h-10 bg-white" />
          </div>
          <div>
            <label htmlFor="pol-due" className={label}>Please read by</label>
            <Input id="pol-due" type="date" value={values.due_date ?? ''} onChange={(e) => set('due_date', e.target.value)} className="h-10 bg-white" />
            {err.due_date && <p className="mt-1 text-sm text-destructive">{err.due_date}</p>}
          </div>
          <div>
            <label htmlFor="pol-status" className={label}>Status</label>
            <select id="pol-status" value={values.status} onChange={(e) => set('status', e.target.value as PolicyInput['status'])} className="h-10 w-full border border-input bg-white px-2 text-sm">
              <option value="draft">Draft (employees do not see it)</option>
              <option value="published">Published (employees must read it)</option>
              <option value="archived">Archived (withdrawn)</option>
            </select>
          </div>
        </div>
        {values.status === 'published' && !published && <p className="text-xs text-muted-foreground">Publishing notifies everyone it applies to.</p>}

        <div className="flex flex-wrap gap-3 border-t pt-4">
          <Button type="submit" disabled={save.submitting}>{save.submitting && !confirmVersion ? 'Saving…' : 'Save'}</Button>
          {published && <Button type="button" variant="outline" className="bg-white" disabled={save.submitting} onClick={() => setConfirmVersion(true)}>Save and publish as new version</Button>}
          <Button asChild variant="outline" className="bg-white"><Link to="/admin/policies">Cancel</Link></Button>
        </div>
      </form>

      <ConfirmDialog open={confirmVersion} title="Publish as a new version?" reversible={false} confirmLabel="Publish new version" busy={save.submitting} error={save.error} onConfirm={() => void submit(undefined, true)} onCancel={() => setConfirmVersion(false)}>
        <p>Everyone this policy applies to will be notified and has to read and confirm <strong>version {(policy?.version ?? 0) + 1}</strong> again. Earlier confirmations stay on record.</p>
      </ConfirmDialog>
    </>
  )
}

export default function PolicyFormPage() {
  const { policyId } = useParams()
  const { data, error, loading, retry } = useAsync(() => (policyId ? getAdminPolicy(policyId) : Promise.resolve(null)), [policyId])
  useEffect(() => {
    document.title = 'Policy | Administration'
  }, [])

  if (error) return <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-semibold text-destructive">Unable to load this policy.</p><Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button></div>
  if (loading && data === undefined) return <Skeleton className="h-96" />
  return <Form key={policyId ?? 'new'} policy={data ?? null} />
}

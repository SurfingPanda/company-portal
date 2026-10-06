import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AdminField, type FieldDef } from '@/components/admin/AdminField'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthorization } from '@/auth/useAuthorization'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { adminApi } from '@/services/admin/adminApi'

interface Overview {
  display_name: string | null
  introduction_title: string | null
  introduction: string | null
  mission: string | null
  vision: string | null
  core_values: { title: string; description: string | null }[]
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
}

const fields: FieldDef[] = [
  { name: 'display_name', label: 'Company display name', kind: 'text', maxLength: 160 },
  { name: 'introduction_title', label: 'Introduction heading', kind: 'text', maxLength: 160 },
  { name: 'introduction', label: 'Introduction / company overview', kind: 'textarea', maxLength: 5000, rows: 5 },
  { name: 'mission', label: 'Mission', kind: 'textarea', maxLength: 3000, rows: 3, help: 'Enter only the approved statement. Leave empty until HR has one.' },
  { name: 'vision', label: 'Vision', kind: 'textarea', maxLength: 3000, rows: 3 },
  { name: 'core_values', label: 'Core values', kind: 'textarea', rows: 6, help: 'One per line. Optionally add a description after a pipe: Integrity | Doing the right thing.' },
]

const toLines = (values: Overview['core_values']) => values.map((v) => (v.description ? `${v.title} | ${v.description}` : v.title)).join('\n')
const fromLines = (text: string) =>
  text.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const [title, ...rest] = line.split('|')
    return { title: title.trim(), description: rest.join('|').trim() || null }
  })

/** Edit the company overview shown at /company. Content stays a draft (hidden) until someone with the publish permission publishes it. */
export default function CompanyOverviewAdminPage() {
  const { data, error, loading, retry } = useAsync(() => adminApi.get<Overview>('/api/admin/hr/company'), [])
  const { hasPermission } = useAuthorization()
  const canPublish = hasPermission('hr.company.publish')
  const [values, setValues] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Overview['status']>('draft')
  const [saved, setSaved] = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!data) return
    setValues({ display_name: data.display_name ?? '', introduction_title: data.introduction_title ?? '', introduction: data.introduction ?? '', mission: data.mission ?? '', vision: data.vision ?? '', core_values: toLines(data.core_values) })
    setStatus(data.status)
  }, [data])

  const save = useMutation((body: Record<string, unknown>) => adminApi.update<Overview>('/api/admin/hr/company', body))

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    setSaved(false)
    const body: Record<string, unknown> = {
      display_name: values.display_name?.trim() || null, introduction_title: values.introduction_title?.trim() || null, introduction: values.introduction?.trim() || null,
      mission: values.mission?.trim() || null, vision: values.vision?.trim() || null, core_values: fromLines(values.core_values ?? ''),
    }
    if (canPublish) body.status = status
    if (await save.mutate(body)) {
      setSaved(true)
      setConfirm(false)
      retry()
    }
  }

  const leaving = data?.status === 'published' && status !== 'published'

  return (
    <>
      <AdminPageHeader
        title="Company Information"
        description="The company overview employees see at /company. Do not enter statements that have not been approved."
        trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'HR Management', href: '/admin/hr' }, { label: 'Company Information' }]}
        actions={<><Button asChild variant="outline" className="bg-white"><Link to="/admin/hr/company/history">History</Link></Button><Button asChild variant="outline" className="bg-white"><Link to="/admin/hr/company/leadership">Leadership</Link></Button><Button asChild variant="outline" className="bg-white"><Link to="/admin/hr/company/locations">Locations</Link></Button></>}
      />
      {error ? <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-semibold text-destructive">Unable to load the company information.</p><Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button></div>
        : loading || !data ? <Skeleton className="h-96 max-w-3xl" /> : (
          <form onSubmit={(e) => (leaving ? (e.preventDefault(), setConfirm(true)) : void submit(e))} noValidate aria-label="Company overview" className="max-w-3xl space-y-5 border bg-white p-5 sm:p-6">
            <p className="text-sm">Current state: <StatusBadge value={data.status} />{data.status !== 'published' && ' Employees see nothing here until it is published.'}</p>
            {saved && <p role="status" className="border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">Company information saved.</p>}
            {save.error && Object.keys(save.fieldErrors).length === 0 && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{save.error}</p>}
            {fields.map((f) => <AdminField key={f.name} def={f} value={values[f.name] ?? ''} error={save.fieldErrors[f.name] ?? Object.entries(save.fieldErrors).find(([k]) => k.startsWith(`${f.name}.`))?.[1]} disabled={save.submitting} onChange={(v) => setValues((p) => ({ ...p, [f.name]: String(v) }))} />)}
            <div>
              <label htmlFor="co-status" className="mb-1.5 block text-sm font-medium">Publication status</label>
              <select id="co-status" value={status} disabled={!canPublish || save.submitting} onChange={(e) => setStatus(e.target.value as Overview['status'])} className="h-10 w-full border border-input bg-white px-2 text-sm">
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published</option>
                <option value="archived">Archived (hidden)</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">{canPublish ? 'Only published content is shown to employees.' : 'You can edit drafts. Publishing needs the company publish permission.'}</p>
            </div>
            <div className="flex gap-3 border-t pt-4"><Button type="submit" disabled={save.submitting}>{save.submitting ? 'Saving…' : 'Save'}</Button></div>
          </form>
        )}
      <ConfirmDialog open={confirm} title="Remove the overview from the company page?" reversible confirmLabel="Save and unpublish" busy={save.submitting} error={save.error} onCancel={() => setConfirm(false)} onConfirm={() => void submit()}>
        <p>The company overview will no longer be shown to employees. It is kept and can be published again.</p>
      </ConfirmDialog>
    </>
  )
}

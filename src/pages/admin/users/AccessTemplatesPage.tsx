import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { deleteAccessTemplate, getAccessTemplates, saveAccessTemplate, type AccessTemplate } from '@/services/admin/adminApi'

const trail = [{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Access', href: '/admin/access' }, { label: 'Templates' }]
const EMPTY: AccessTemplate = { id: 0, name: '', description: '', permissions: [] }

/** Create and edit the named sets of permissions that can be applied to people from the Access screen. */
export default function AccessTemplatesPage() {
  const templates = useAsync(getAccessTemplates, [])
  const [draft, setDraft] = useState<AccessTemplate | null>(null)
  const [removing, setRemoving] = useState<AccessTemplate | null>(null)
  const save = useMutation((t: AccessTemplate) => saveAccessTemplate(t))
  const remove = useMutation((t: AccessTemplate) => deleteAccessTemplate(t.id))
  const message = save.error ?? Object.values(save.fieldErrors)[0]

  const toggle = (permission: string) => setDraft((d) => d && { ...d, permissions: d.permissions.includes(permission) ? d.permissions.filter((p) => p !== permission) : [...d.permissions, permission] })
  const submit = async () => {
    if (!draft) return
    const ok = await save.mutate(draft)
    if (ok) {
      setDraft(null)
      templates.retry()
    }
  }
  const confirmRemove = async () => {
    if (!removing) return
    await remove.mutate(removing)
    setRemoving(null)
    templates.retry()
  }

  return (
    <>
      <AdminPageHeader
        title="Access templates"
        description="Ready-made sets of access, for example by job function. Apply one to an employee on their Access page, then adjust and save. Changing a template does not change anyone's saved access."
        trail={trail}
        actions={<Button type="button" onClick={() => { save.reset(); setDraft({ ...EMPTY }) }}>New template</Button>}
      />

      {draft && (
        <section aria-labelledby="tpl-h" className="mb-6 border bg-white p-4">
          <h2 id="tpl-h" className="font-serif text-base font-semibold text-primary">{draft.id ? 'Edit template' : 'New template'}</h2>
          {message && <p role="alert" className="mt-2 text-sm text-destructive">{message}</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="tpl-name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</label>
              <input id="tpl-name" value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1 h-9 w-full border border-input bg-white px-2 text-sm" />
            </div>
            <div>
              <label htmlFor="tpl-desc" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">What it is for</label>
              <input id="tpl-desc" value={draft.description ?? ''} maxLength={255} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="mt-1 h-9 w-full border border-input bg-white px-2 text-sm" />
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {(templates.data?.catalog ?? []).map((group) => (
              <fieldset key={group.group} className="border p-3">
                <legend className="px-1 text-sm font-semibold">{group.group}</legend>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item.permission} className="flex items-start gap-2 text-sm">
                      <input id={`t-${item.permission}`} type="checkbox" className="mt-1 size-4" checked={draft.permissions.includes(item.permission)} onChange={() => toggle(item.permission)} />
                      <label htmlFor={`t-${item.permission}`}>{item.label}</label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" disabled={!draft.name.trim() || save.submitting} onClick={() => void submit()}>{save.submitting ? 'Saving…' : 'Save template'}</Button>
            <Button type="button" variant="outline" className="bg-white" onClick={() => setDraft(null)}>Cancel</Button>
          </div>
        </section>
      )}

      {templates.error ? (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-semibold text-destructive">Unable to load templates.</p><Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={templates.retry}>Try again</Button></div>
      ) : templates.loading || !templates.data ? (
        <Skeleton className="h-48" />
      ) : (
        <ul className="divide-y border bg-white">
          {templates.data.data.map((t) => (
            <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 p-3 text-sm">
              <div className="max-w-2xl">
                <p className="font-medium">{t.name} <span className="text-xs font-normal text-muted-foreground">({t.permissions.length} permissions)</span></p>
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" className="bg-white" onClick={() => { save.reset(); setDraft(t) }}>Edit</Button>
                <Button type="button" size="sm" variant="outline" className="bg-white" onClick={() => setRemoving(t)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm"><Link to="/admin/access" className="text-primary underline-offset-2 hover:underline">Back to Access</Link></p>

      <ConfirmDialog open={removing !== null} title={`Delete the ${removing?.name ?? ''} template?`} reversible={false} confirmLabel="Delete template" busy={remove.submitting} error={remove.error ?? undefined} onCancel={() => setRemoving(null)} onConfirm={() => void confirmRemove()}>
        <p>People who already received access from this template keep it. Only the shortcut is removed.</p>
      </ConfirmDialog>
    </>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminFilters } from '@/components/admin/AdminFilters'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminList } from '@/hooks/useAdminList'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { roleLabel } from '@/auth/roles'
import { getAccessTemplates, getUserAccess, getUsers, saveUserAccess, type UserAccess } from '@/services/admin/adminApi'
import type { AdminUser } from '@/types/admin'

const trail = [{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Access' }]

/** Pick a person to edit what they can do. */
export function AccessListPage() {
  const list = useAdminList<AdminUser>(getUsers, [], { sort: 'employee_id', direction: 'asc' })
  const columns: AdminColumn<AdminUser>[] = [
    { key: 'employee_id', header: 'Employee ID', sortKey: 'employee_id', render: (u) => <Link to={`/admin/access/${u.id}`} className="font-mono text-primary underline-offset-2 hover:underline">{u.employee_id}</Link> },
    { key: 'name', header: 'Name', render: (u) => <span className="font-medium">{u.display_name}</span> },
    { key: 'email', header: 'Company email', render: (u) => u.email },
    { key: 'roles', header: 'Role', render: (u) => u.roles.map(roleLabel).join(', ') },
    { key: 'actions', header: 'Actions', className: 'text-right', render: (u) => <Button asChild variant="outline" size="sm" className="bg-white"><Link to={`/admin/access/${u.id}`} aria-label={`Edit access for ${u.employee_id}`}>Edit access</Link></Button> },
  ]
  return (
    <>
      <AdminPageHeader title="Access" description="Choose an employee, tick what they are allowed to do (for example create policies or upload documents) and save." trail={trail} actions={<Button asChild variant="outline" className="bg-white"><Link to="/admin/access/templates">Access templates</Link></Button>} />
      <AdminFilters search={list.search} searchLabel="Search employee ID or email" filters={[]} values={list.params} onChange={list.update} />
      <AdminTable
        caption="Employees"
        columns={columns}
        page={list.data}
        loading={list.loading}
        error={list.error}
        onRetry={list.retry}
        rowKey={(u) => u.id}
        sort={String(list.params.sort ?? '')}
        direction={list.params.direction as 'asc' | 'desc' | undefined}
        onSort={(key) => list.update({ sort: key, direction: list.params.sort === key && list.params.direction === 'asc' ? 'desc' : 'asc' })}
        onPage={(page) => list.update({ page: String(page) })}
        emptyTitle="No employees found"
        emptyHint="Change the search."
      />
    </>
  )
}

/** Add a ready-made set of access (by job function) to the ticked boxes. Nothing is saved until "Save access". */
function ApplyTemplate({ inherited, grantable, onApply }: { inherited: Set<string>; grantable: Set<string>; onApply: (permissions: string[], name: string) => void }) {
  const templates = useAsync(getAccessTemplates, [])
  const [chosen, setChosen] = useState('')
  const list = templates.data?.data ?? []
  const selected = list.find((t) => String(t.id) === chosen)
  return (
    <section aria-labelledby="tpl-apply-h" className="mb-4 border bg-white p-4">
      <h2 id="tpl-apply-h" className="font-serif text-base font-semibold text-primary">Apply a template</h2>
      <p className="mt-1 text-xs text-muted-foreground">Templates are sets of access for a job function (HR Staff, IT Support, Recruiter&hellip;). The role stays the base; a template adds to what is already ticked. <Link to="/admin/access/templates" className="text-primary underline-offset-2 hover:underline">Edit templates</Link></p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="tpl-select" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Template</label>
          <select id="tpl-select" value={chosen} onChange={(e) => setChosen(e.target.value)} className="h-9 min-w-56 border border-input bg-white px-2 text-sm">
            <option value="">Choose a template…</option>
            {list.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <Button type="button" size="sm" disabled={!selected} onClick={() => { if (selected) { onApply(selected.permissions.filter((p) => grantable.has(p) && !inherited.has(p)), selected.name); setChosen('') } }}>Apply template</Button>
      </div>
      {selected?.description && <p className="mt-2 text-xs text-muted-foreground">{selected.description}</p>}
    </section>
  )
}

/** Pick another employee and fill the check boxes with everything they can do. Nothing is saved until "Save access". */
function CopyAccess({ targetId, grantable, inherited, onCopy }: { targetId: number; grantable: Set<string>; inherited: Set<string>; onCopy: (permissions: string[], from: string) => void }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<AdminUser[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    const query = term.trim()
    if (query.length < 2) return
    let alive = true
    const timer = setTimeout(() => {
      getUsers({ search: query, per_page: 6 }).then((page) => { if (alive) setResults(page.data.filter((u) => u.id !== targetId)) }, () => { if (alive) setResults([]) })
    }, 250)
    return () => { alive = false; clearTimeout(timer) }
  }, [term, targetId])

  const copyFrom = async (source: AdminUser) => {
    setBusy(true)
    setError(undefined)
    try {
      const theirs = await getUserAccess(source.id)
      const all = [...theirs.from_roles, ...theirs.granted]
      onCopy(all.filter((p) => grantable.has(p) && !inherited.has(p)), source.employee_id)
      setTerm('')
      setResults([])
    } catch {
      setError('Could not read that employee. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="copy-h" className="mb-6 border bg-white p-4">
      <h2 id="copy-h" className="font-serif text-base font-semibold text-primary">Copy access from another employee</h2>
      <p className="mt-1 text-xs text-muted-foreground">Search for the employee whose access you want to reuse. Their access is ticked below for you to review; nothing is saved until you press Save access.</p>
      <label htmlFor="copy-search" className="mt-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee ID or email</label>
      <input id="copy-search" value={term} onChange={(e) => setTerm(e.target.value)} autoComplete="off" className="mt-1 h-9 w-full max-w-sm border border-input bg-white px-2 text-sm" />
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      {term.trim().length >= 2 && results.length > 0 && (
        <ul className="mt-2 max-w-xl divide-y border">
          {results.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span><span className="font-mono">{u.employee_id}</span> <span className="font-medium">{u.display_name}</span> <span className="text-xs text-muted-foreground">{u.roles.map(roleLabel).join(', ')}</span></span>
              <Button type="button" size="sm" variant="outline" className="bg-white" disabled={busy} onClick={() => void copyFrom(u)}>Copy access</Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AccessEditor({ initial }: { initial: UserAccess }) {
  const [access, setAccess] = useState(initial)
  const [checked, setChecked] = useState<Set<string>>(new Set(initial.granted))
  const [saved, setSaved] = useState(false)
  const [copiedFrom, setCopiedFrom] = useState<string>()
  const [appliedTemplate, setAppliedTemplate] = useState<string>()
  const save = useMutation((permissions: string[]) => saveUserAccess(access.user.id, permissions))
  const fromRoles = new Set(access.from_roles)
  const grantable = new Set(access.catalog.flatMap((g) => g.items.map((i) => i.permission)))
  const dirty = checked.size !== access.granted.length || access.granted.some((p) => !checked.has(p))

  const toggle = (permission: string) => {
    setSaved(false)
    setCopiedFrom(undefined)
    setAppliedTemplate(undefined)
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(permission)) next.delete(permission)
      else next.add(permission)
      return next
    })
  }
  const submit = async () => {
    const result = await save.mutate([...checked])
    if (result) {
      setAccess(result)
      setChecked(new Set(result.granted))
      setSaved(true)
      setCopiedFrom(undefined)
      setAppliedTemplate(undefined)
    }
  }
  const message = save.error ?? Object.values(save.fieldErrors)[0]

  return (
    <>
      <AdminPageHeader
        title={`Access for ${access.user.employee_id}`}
        description={`${access.user.email} · ${access.user.roles.map(roleLabel).join(', ')}`}
        trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Access', href: '/admin/access' }, { label: access.user.employee_id }]}
        actions={<Button asChild variant="outline" className="bg-white"><Link to={`/admin/users/${access.user.id}`}>Account details</Link></Button>}
      />
      {message && <p role="alert" className="mb-4 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{message}</p>}
      {saved && <p role="status" className="mb-4 border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">Access saved. It applies the next time the page loads for them.</p>}
      <ApplyTemplate inherited={fromRoles} grantable={grantable} onApply={(permissions, name) => { setChecked((prev) => new Set([...prev, ...permissions])); setAppliedTemplate(name); setCopiedFrom(undefined); setSaved(false) }} />
      {appliedTemplate && <p role="status" className="mb-4 border border-amber-600/40 bg-amber-50 p-3 text-sm text-amber-900">The <strong>{appliedTemplate}</strong> template was added to the check boxes. Review them, then press Save access.</p>}
      <CopyAccess targetId={access.user.id} grantable={grantable} inherited={fromRoles} onCopy={(permissions, from) => { setChecked(new Set(permissions)); setCopiedFrom(from); setAppliedTemplate(undefined); setSaved(false) }} />
      {copiedFrom && <p role="status" className="mb-4 border border-amber-600/40 bg-amber-50 p-3 text-sm text-amber-900">Access copied from <strong>{copiedFrom}</strong>. Review the check boxes, then press Save access. It replaces what was ticked before.</p>}
      <p className="mb-4 text-sm text-muted-foreground">Ticked items are given to this person on top of their role. Items marked &ldquo;from role&rdquo; are already included and are changed by changing the role. Administration powers (users, roles, settings, audit log) are not listed: they come only from the Administrator role.</p>

      <div className="grid gap-6 lg:grid-cols-2">
        {access.catalog.map((group) => (
          <fieldset key={group.group} className="border bg-white p-4">
            <legend className="px-1 font-serif text-base font-semibold text-primary">{group.group}</legend>
            <ul className="space-y-2">
              {group.items.map((item) => {
                const inherited = fromRoles.has(item.permission)
                const id = `perm-${item.permission}`
                return (
                  <li key={item.permission} className="flex items-start gap-2 text-sm">
                    <input id={id} type="checkbox" className="mt-1 size-4" checked={inherited || checked.has(item.permission)} disabled={inherited || save.submitting} onChange={() => toggle(item.permission)} />
                    <label htmlFor={id}>
                      <span className="font-medium">{item.label}</span>
                      {inherited && <span className="ml-2 text-xs text-muted-foreground">from role</span>}
                      {item.hint && <span className="block text-xs text-muted-foreground">{item.hint}</span>}
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <Button type="button" disabled={!dirty || save.submitting} onClick={() => void submit()}>{save.submitting ? 'Saving…' : 'Save access'}</Button>
        <Button type="button" variant="outline" className="bg-white" disabled={!dirty || save.submitting} onClick={() => { setChecked(new Set(access.granted)); setSaved(false); setCopiedFrom(undefined); setAppliedTemplate(undefined) }}>Undo changes</Button>
      </div>
    </>
  )
}

export function AccessEditPage() {
  const { userId = '' } = useParams()
  const { data, error, loading, retry } = useAsync(() => getUserAccess(userId), [userId])
  if (error) return <div role="alert" className="border border-destructive/40 bg-destructive/5 p-6 text-sm"><p className="font-semibold text-destructive">Unable to load this person.</p><p className="mt-1 text-muted-foreground">{error.message}</p><Button type="button" variant="outline" size="sm" className="mt-3 bg-white" onClick={retry}>Try again</Button></div>
  if (loading || !data) return <Skeleton className="h-96 max-w-4xl" />
  return <AccessEditor key={data.user.id} initial={data} />
}

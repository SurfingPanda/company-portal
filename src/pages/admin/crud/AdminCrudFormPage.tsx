import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminField } from '@/components/admin/AdminField'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { adminApi } from '@/services/admin/adminApi'
import type { AdminRecord } from '@/types/admin'
import type { CrudConfig } from '@/pages/admin/crud/crudTypes'

type Values = Record<string, string | boolean>

/** Default conversion: nullable text/number/datetime fields send null when empty; checkboxes send booleans. */
function defaultBody(config: CrudConfig, values: Values, mode: 'create' | 'edit', locked: (name: string) => boolean = () => false): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  for (const field of config.fields) {
    if (field.createOnly && mode === 'edit') continue
    if (locked(field.name)) continue // read-only: never sent, so it cannot be overwritten
    const value = values[field.name]
    if (field.kind === 'checkbox') body[field.name] = value === true
    else if (field.kind === 'datetime') body[field.name] = value ? new Date(String(value)).toISOString() : null
    else if (field.kind === 'number') body[field.name] = value === '' ? null : Number(value)
    else if (value === '' && !field.required) body[field.name] = null
    else body[field.name] = value
  }
  return body
}

const toLocalInput = (iso: unknown) => {
  if (typeof iso !== 'string' || !iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultValues(config: CrudConfig, record: AdminRecord): Values {
  const values: Values = {}
  for (const field of config.fields) {
    const raw = record[field.name]
    if (field.kind === 'checkbox') values[field.name] = raw === true
    else if (field.kind === 'datetime') values[field.name] = toLocalInput(raw)
    else values[field.name] = raw === null || raw === undefined ? '' : String(raw)
  }
  return values
}

/** Generic create/edit screen for a content module. Laravel's 422 messages appear next to the matching fields. */
export function AdminCrudFormPage({ config }: { config: CrudConfig }) {
  const { id } = useParams()
  const editing = id !== undefined
  const navigate = useNavigate()
  const record = useAsync(() => (editing ? adminApi.get<AdminRecord>(`${config.api}/${id}`) : Promise.resolve(null)), [id])
  const [values, setValues] = useState<Values>(config.initial)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (record.data) setValues(config.toForm ? config.toForm(record.data) : defaultValues(config, record.data))
  }, [record.data, config])

  const options = useAsync(async () => {
    const entries = await Promise.all(Object.entries(config.dynamicOptions ?? {}).map(async ([name, load]) => [name, await load()] as const))
    return Object.fromEntries(entries)
  }, [config])
  const fields = config.fields.map((f) => {
    const withOptions = options.data?.[f.name] ? { ...f, options: options.data[f.name] } : f
    const reason = editing && record.data ? config.lockReason?.(record.data, f.name) : undefined
    return reason ? { ...withOptions, help: reason } : withOptions
  })

  // Visible fields grouped into cards, in the order the sections first appear.
  const sections = fields
    .filter((f) => !f.showWhen || f.showWhen.values.includes(String(values[f.showWhen.field] ?? '')))
    .reduce<{ title: string; fields: typeof fields }[]>((groups, f) => {
      const title = f.section ?? ''
      const group = groups.find((g) => g.title === title)
      if (group) group.fields.push(f)
      else groups.push({ title, fields: [f] })
      return groups
    }, [])

  const save = useMutation(async (body: Record<string, unknown>) => (editing ? adminApi.update<AdminRecord>(`${config.api}/${id}`, body) : adminApi.create<AdminRecord>(config.api, body)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setClientErrors({})
    let body: Record<string, unknown>
    try {
      body = config.toBody ? config.toBody(values, editing ? 'edit' : 'create') : defaultBody(config, values, editing ? 'edit' : 'create', (name) => Boolean(editing && record.data && config.lockReason?.(record.data, name)))
    } catch (error) {
      setClientErrors({ [(error as { field?: string }).field ?? config.fields[0].name]: (error as Error).message })
      return
    }
    const saved = await save.mutate(body)
    if (saved) navigate(config.route, { state: { saved: true } })
  }

  const errors = { ...save.fieldErrors, ...clientErrors }
  const title = editing ? `Edit ${config.singular.toLowerCase()}` : `Create ${config.singular.toLowerCase()}`

  return (
    <>
      <AdminPageHeader title={title} description={config.description} trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: config.title, href: config.route }, { label: title }]} />
      {editing && record.loading && !record.data ? (
        <Skeleton className="h-64 w-full" />
      ) : record.error ? (
        <div role="alert" className="max-w-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Unable to load this record.</p>
          <Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={record.retry}>Try again</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate aria-label={title} className="w-full">
          <div className="space-y-5">
            {save.error && Object.keys(errors).length === 0 && (
              <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{save.error}</p>
            )}
            {Object.keys(errors).length > 0 && (
              <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">Please fix the highlighted fields.</p>
            )}
            {options.error && (
              <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                Some choices could not be loaded.{' '}
                <button type="button" className="underline" onClick={options.retry}>Try again</button>
              </p>
            )}
            {sections.map((section, index) => (
              <section key={section.title} aria-label={section.title || title} className="border bg-white shadow-sm">
                {section.title && (
                  <header className="flex items-start gap-3 border-b bg-muted/40 px-5 py-3">
                    {sections.length > 1 && <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span>}
                    <div>
                      <h2 className="font-serif text-base font-semibold leading-tight text-primary">{section.title}</h2>
                      {config.sectionHints?.[section.title] && <p className="mt-0.5 text-xs text-muted-foreground">{config.sectionHints[section.title]}</p>}
                    </div>
                  </header>
                )}
                <div className="grid gap-x-8 gap-y-6 p-5 md:grid-cols-2 xl:grid-cols-3">
                  {section.fields.map((field) => (
                    <div key={field.name} className={field.wide || field.kind === 'textarea' || field.kind === 'json' ? 'md:col-span-2 xl:col-span-3' : undefined}>
                      <AdminField
                        def={field}
                        value={values[field.name] ?? ''}
                        error={errors[field.name]}
                        disabled={save.submitting || (editing && field.createOnly) || Boolean(editing && record.data && config.lockReason?.(record.data, field.name))}
                        onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="sticky bottom-0 z-10 -mx-1 mt-5 flex flex-wrap items-center justify-end gap-3 border-t bg-background/95 px-1 py-3 backdrop-blur">
            <p className="mr-auto hidden text-xs text-muted-foreground sm:block"><span aria-hidden="true" className="text-destructive">*</span> Required</p>
            <Button asChild variant="outline" className="bg-white"><Link to={config.route}>Cancel</Link></Button>
            <Button type="submit" disabled={save.submitting}>{save.submitting ? 'Saving…' : editing ? 'Save changes' : `Create ${config.singular.toLowerCase()}`}</Button>
          </div>
        </form>
      )}
    </>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AdminFilters } from '@/components/admin/AdminFilters'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useAdminList } from '@/hooks/useAdminList'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { adminApi } from '@/services/admin/adminApi'
import type { AdminRecord } from '@/types/admin'
import type { CrudConfig, QuickAction } from '@/pages/admin/crud/crudTypes'

type Pending = { kind: 'delete' } | { kind: 'quick'; action: QuickAction }

/** Generic list screen for a content module (see CrudConfig). Every change goes to Laravel, which authorizes and audits it. */
export function AdminCrudListPage({ config }: { config: CrudConfig }) {
  const filterKeys = config.filters.map((f) => f.key)
  const loaded = useAsync(async () => Object.fromEntries(await Promise.all(config.filters.filter((f) => f.load).map(async (f) => [f.key, await f.load!()] as const))), [config])
  const filters = config.filters.map((f) => (loaded.data?.[f.key] ? { ...f, options: loaded.data[f.key] } : f))
  const list = useAdminList<AdminRecord>((params) => adminApi.list<AdminRecord>(config.api, params), filterKeys, { sort: config.defaultSort, direction: config.defaultSort === 'title' || config.defaultSort === 'name' ? 'asc' : 'desc' })
  const [pending, setPending] = useState<{ record: AdminRecord; what: Pending } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const act = useMutation(async (input: { record: AdminRecord; what: Pending }) => {
    if (input.what.kind === 'delete') await adminApi.remove(`${config.api}/${input.record.id}`)
    else {
      const raw = input.what.action.value
      // Boolean switches are sent as real booleans.
      await adminApi.update(`${config.api}/${input.record.id}`, { [input.what.action.field]: raw === 'true' ? true : raw === 'false' ? false : raw })
    }
    return input
  })

  const run = async (record: AdminRecord, what: Pending) => {
    const done = await act.mutate({ record, what })
    if (done) {
      setPending(null)
      setNotice(what.kind === 'delete' ? `${config.label(record)} was deleted.` : `${config.label(record)}: ${what.action.label} done.`)
      list.retry()
    }
  }

  const start = (record: AdminRecord, what: Pending) => {
    setNotice(null)
    act.reset()
    if (what.kind === 'quick' && !what.action.confirm) void run(record, what)
    else setPending({ record, what })
  }

  const columns: AdminColumn<AdminRecord>[] = [
    ...config.columns,
    {
      key: 'actions',
      header: 'Actions',
      className: 'whitespace-nowrap text-right',
      render: (record) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button asChild variant="outline" size="sm" className="bg-white">
            <Link to={`${config.route}/${record.id}/edit`} aria-label={`Edit ${config.label(record)}`}>Edit</Link>
          </Button>
          {(config.quickActions ?? [])
            .filter((a) => a.from.includes(String(record[a.field])))
            .map((a) => (
              <Button key={a.label} type="button" variant="outline" size="sm" className="bg-white" onClick={() => start(record, { kind: 'quick', action: a })} aria-label={`${a.label}: ${config.label(record)}`}>
                {a.label}
              </Button>
            ))}
          {!config.noDelete && (
            <Button type="button" variant="outline" size="sm" className="bg-white text-destructive" onClick={() => start(record, { kind: 'delete' })} aria-label={`Delete ${config.label(record)}`}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ]

  const toggleSort = (key: string) =>
    list.update({ sort: key, direction: list.params.sort === key && list.params.direction === 'asc' ? 'desc' : 'asc' })

  return (
    <>
      <AdminPageHeader
        title={config.title}
        description={config.description}
        trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: config.title }]}
        actions={
          <div className="flex flex-wrap gap-2">
            {config.extraActions?.map((a) => (
              <Button key={a.href} asChild variant="outline" className="bg-white">
                <Link to={a.href}>{a.label}</Link>
              </Button>
            ))}
            <Button asChild>
              <Link to={`${config.route}/create`}>
                <Plus aria-hidden="true" /> Create {config.singular}
              </Link>
            </Button>
          </div>
        }
      />
      {notice && (
        <p role="status" className="mb-4 border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">
          {notice}
        </p>
      )}
      <AdminFilters search={list.search} filters={filters} values={list.params} onChange={list.update} />
      <AdminTable
        caption={`${config.title} list`}
        columns={columns}
        page={list.data}
        loading={list.loading}
        error={list.error}
        onRetry={list.retry}
        rowKey={(r) => r.id}
        sort={String(list.params.sort ?? '')}
        direction={list.params.direction as 'asc' | 'desc' | undefined}
        onSort={toggleSort}
        onPage={(page) => list.update({ page: String(page) })}
        emptyTitle={`No ${config.title.toLowerCase()} found`}
        emptyHint={`Create the first ${config.singular.toLowerCase()}, or change the search and filters.`}
      />

      <ConfirmDialog
        open={pending !== null}
        title={pending?.what.kind === 'delete' ? `Delete ${config.singular.toLowerCase()}?` : pending?.what.kind === 'quick' ? (pending.what.action.confirm?.title ?? 'Confirm') : ''}
        reversible={pending?.what.kind === 'quick' ? (pending.what.action.confirm?.reversible ?? true) : false}
        confirmLabel={pending?.what.kind === 'delete' ? 'Delete' : (pending?.what.kind === 'quick' ? pending.what.action.label : 'Confirm')}
        busy={act.submitting}
        error={act.error}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void run(pending.record, pending.what)}
      >
        {pending?.what.kind === 'delete' ? (
          <p>
            <strong>{config.label(pending.record)}</strong> will be removed from the portal. Employees will no longer see it.
          </p>
        ) : pending?.what.kind === 'quick' ? (
          pending.what.action.confirm?.body(pending.record)
        ) : null}
      </ConfirmDialog>
    </>
  )
}

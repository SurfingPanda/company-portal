import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AdminPage } from '@/types/admin'
import { cn } from '@/lib/utils'

export interface AdminColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Server-side sort key (must be whitelisted by the API). Omit for columns that cannot be sorted. */
  sortKey?: string
  className?: string
}

interface AdminTableProps<T> {
  caption: string
  columns: AdminColumn<T>[]
  page: AdminPage<T> | undefined
  loading: boolean
  error: Error | undefined
  onRetry: () => void
  rowKey: (row: T) => string | number
  sort?: string
  direction?: 'asc' | 'desc'
  onSort?: (sortKey: string) => void
  onPage: (page: number) => void
  emptyTitle?: string
  emptyHint?: string
}

/**
 * The shared administration table: server-side sort and pagination, loading skeleton, empty and error states. Scrolls
 * horizontally on narrow screens instead of breaking the layout. Rows with actions render them inside a column.
 */
export function AdminTable<T>({ caption, columns, page, loading, error, onRetry, rowKey, sort, direction, onSort, onPage, emptyTitle = 'No records found', emptyHint = 'Try changing the search or filters.' }: AdminTableProps<T>) {
  if (error) {
    return (
      <div role="alert" className="border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="font-semibold text-destructive">Unable to load this list.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button type="button" variant="outline" size="sm" className="mt-3 bg-white" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  }

  const rows = page?.data ?? []
  const meta = page?.meta

  return (
    <div className="border bg-white">
      <div className="overflow-x-auto" aria-busy={loading}>
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((c) => {
                const active = c.sortKey !== undefined && sort === c.sortKey
                return (
                  <TableHead key={c.key} scope="col" aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : undefined} className={cn('whitespace-nowrap text-xs uppercase tracking-wider', c.className)}>
                    {c.sortKey && onSort ? (
                      <button type="button" onClick={() => onSort(c.sortKey!)} className="inline-flex items-center gap-1 font-semibold hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">
                        {c.header}
                        {active ? direction === 'asc' ? <ArrowUp className="size-3.5" aria-hidden="true" /> : <ArrowDown className="size-3.5" aria-hidden="true" /> : <ChevronsUpDown className="size-3.5 opacity-40" aria-hidden="true" />}
                        <span className="sr-only"> (sort)</span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0
              ? Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        <Skeleton className="h-4 w-full max-w-40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow key={rowKey(row)} className={cn(loading && 'opacity-60')}>
                    {columns.map((c) => (
                      <TableCell key={c.key} className={cn('align-middle text-sm', c.className)}>
                        {c.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {!loading && rows.length === 0 && (
        <div role="status" className="px-6 py-10 text-center">
          <p className="font-semibold text-primary">{emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{emptyHint}</p>
        </div>
      )}

      {meta && meta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5 text-sm">
          <p aria-live="polite" className="text-muted-foreground">
            Page {meta.current_page} of {meta.last_page} · {meta.total} {meta.total === 1 ? 'record' : 'records'}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>
              Previous
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

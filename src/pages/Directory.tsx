import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DepartmentSummary } from '@/components/directory/DepartmentSummary'
import { DirectoryEmptyState } from '@/components/directory/DirectoryEmptyState'
import { DirectoryErrorState } from '@/components/directory/DirectoryErrorState'
import { DirectoryFilters } from '@/components/directory/DirectoryFilters'
import { DirectoryLoadingState } from '@/components/directory/DirectoryLoadingState'
import { DirectoryPagination } from '@/components/directory/DirectoryPagination'
import { DirectorySearch } from '@/components/directory/DirectorySearch'
import { DirectorySort } from '@/components/directory/DirectorySort'
import { DirectoryTable } from '@/components/directory/DirectoryTable'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { DIRECTORY_PAGE_SIZE, statusOptions } from '@/data/directoryOptions'
import { useAsync } from '@/hooks/useAsync'
import { getDepartmentSummary, getEmployees } from '@/services/employeeService'
import type { EmployeeQuery, EmployeeSortField, SortDirection } from '@/types/employee'

const SORT_FIELDS: EmployeeSortField[] = ['name', 'department', 'position']

/** Filter, sort and page state lives in the URL so results can be bookmarked and shared. */
function parseQuery(params: URLSearchParams): Required<Pick<EmployeeQuery, 'sortBy' | 'sortDir' | 'page' | 'perPage'>> & EmployeeQuery {
  const sort = params.get('sort') as EmployeeSortField | null
  const status = params.get('status')
  return {
    search: params.get('q') ?? undefined,
    department: params.get('department') ?? undefined,
    location: params.get('location') ?? undefined,
    status: statusOptions.find((s) => s.value === status)?.value,
    sortBy: sort && SORT_FIELDS.includes(sort) ? sort : 'name',
    sortDir: params.get('dir') === 'desc' ? 'desc' : 'asc',
    page: Math.max(1, Number(params.get('page')) || 1),
    perPage: DIRECTORY_PAGE_SIZE,
  }
}

export default function Directory() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => parseQuery(params), [params])
  const [searchInput, setSearchInput] = useState(query.search ?? '')

  const { data, error, loading, retry } = useAsync(() => getEmployees(query), [params.toString()])
  const { data: departments } = useAsync(getDepartmentSummary, [])

  const update = (changes: Record<string, string | undefined>, replace = false) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace },
    )
  }

  // Debounce typing into the URL; keep the input in step when the URL changes (back/forward, clear).
  useEffect(() => {
    if (searchInput === (params.get('q') ?? '')) return
    const timer = setTimeout(() => update({ q: searchInput }, true), 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const urlSearch = params.get('q') ?? ''
  useEffect(() => {
    setSearchInput(urlSearch)
  }, [urlSearch])

  const clearAll = () => {
    setSearchInput('')
    setParams({})
  }

  const handleSort = (field: EmployeeSortField) => {
    const dir: SortDirection = query.sortBy === field && query.sortDir === 'asc' ? 'desc' : 'asc'
    update({ sort: field === 'name' ? undefined : field, dir: dir === 'desc' ? 'desc' : undefined })
  }

  const hasFilters = Boolean(query.search?.trim() || query.department || query.location || query.status)
  const total = data?.total ?? 0
  const page = data?.current_page ?? query.page
  const from = total === 0 ? 0 : (page - 1) * DIRECTORY_PAGE_SIZE + 1
  const to = Math.min(page * DIRECTORY_PAGE_SIZE, total)

  let results
  if (error) results = <DirectoryErrorState onRetry={retry} />
  else if (!data) results = <DirectoryLoadingState />
  else if (data.data.length === 0) results = <DirectoryEmptyState onClear={clearAll} />
  else
    results = (
      <>
        <DirectoryTable employees={data.data} sortBy={query.sortBy} sortDir={query.sortDir} onSortChange={handleSort} busy={loading} />
        <DirectoryPagination
          page={data.current_page}
          lastPage={data.last_page}
          total={data.total}
          perPage={data.per_page}
          onPageChange={(p) => {
            update({ page: p > 1 ? String(p) : undefined })
            window.scrollTo({ top: 0 })
          }}
        />
      </>
    )

  return (
    <PageContainer className="pb-16">
      <PageHeader
        title="Employee Directory"
        description="Find contact information for employees and departments across Eljin Corporation."
        breadcrumbs={[{ label: 'Employee Directory' }]}
      />

      <div className="mt-6 space-y-4 border bg-white p-4 sm:p-5">
        <DirectorySearch value={searchInput} onChange={setSearchInput} />
        <DirectoryFilters
          values={{ department: query.department, location: query.location, status: query.status }}
          onChange={(v) => update({ department: v.department, location: v.location, status: v.status })}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Department overview">
          <DepartmentSummary departments={departments} selected={query.department} onSelect={(department) => update({ department })} />
        </aside>

        <section aria-label="Employees" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {data ? (
                <>
                  <span className="font-semibold text-foreground">{total} employees</span>
                  {total > 0 && <span className="ml-2">Showing {from}–{to} of {total}</span>}
                </>
              ) : (
                'Loading…'
              )}
              {hasFilters && (
                <button type="button" onClick={clearAll} className="ml-3 text-primary underline-offset-4 hover:underline">
                  Clear filters
                </button>
              )}
            </p>
            <div className="md:hidden">
              <DirectorySort sortBy={query.sortBy} sortDir={query.sortDir} onChange={(sort, dir) => update({ sort: sort === 'name' ? undefined : sort, dir: dir === 'desc' ? 'desc' : undefined })} />
            </div>
          </div>
          {results}
        </section>
      </div>
    </PageContainer>
  )
}

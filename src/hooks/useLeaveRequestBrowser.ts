import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { requestStatusLabels } from '@/data/requestCategories'
import { useAsync } from '@/hooks/useAsync'
import { getLeaveRequests, LEAVE_PAGE_SIZE } from '@/services/hrService'
import type { LeaveRequestQuery, LeaveSort } from '@/types/hr'
import type { RequestStatus } from '@/types/request'

export const leaveSortOptions: { value: LeaveSort; label: string }[] = [
  { value: 'submitted-desc', label: 'Newest submitted' },
  { value: 'submitted-asc', label: 'Oldest submitted' },
  { value: 'start-asc', label: 'Leave start (earliest)' },
  { value: 'start-desc', label: 'Leave start (latest)' },
]

const isoDate = (value: string | null) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined)

/** Leave request search, filters, sort and page, kept in the URL. */
export function useLeaveRequestBrowser() {
  const [params, setParams] = useSearchParams()

  const query = useMemo(() => {
    const status = params.get('status')
    const from = isoDate(params.get('from'))
    const to = isoDate(params.get('to'))
    return {
      search: params.get('q') ?? undefined,
      status: status && status in requestStatusLabels ? (status as RequestStatus) : undefined,
      from,
      // An inverted range would match nothing; ignore it until the user fixes it.
      to: from && to && to < from ? undefined : to,
      sort: leaveSortOptions.find((s) => s.value === params.get('sort'))?.value ?? ('submitted-desc' as const),
      page: Math.max(1, Number(params.get('page')) || 1),
      perPage: LEAVE_PAGE_SIZE,
    } satisfies LeaveRequestQuery
  }, [params])

  const [searchInput, setSearchInput] = useState(query.search ?? '')
  const { data, error, loading, retry } = useAsync(() => getLeaveRequests(query), [JSON.stringify(query)])

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

  const hasFilters = Boolean(query.search?.trim() || query.status || query.from || query.to)

  const clearFilters = () => {
    setSearchInput('')
    setParams((prev) => {
      const next = new URLSearchParams()
      const sort = prev.get('sort')
      if (sort) next.set('sort', sort)
      return next
    })
  }

  return { query, data, error, loading, retry, searchInput, setSearchInput, update, hasFilters, clearFilters }
}

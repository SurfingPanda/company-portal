import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { applicationStatusLabels } from '@/lib/recruitment'
import { getApplications } from '@/services/recruitmentService'
import type { ApplicationQuery, ApplicationStatus } from '@/types/recruitment'

/** Application search, status filter, date sort and page, kept in the URL. */
export function useApplicationBrowser() {
  const [params, setParams] = useSearchParams()

  const query = useMemo(() => {
    const status = params.get('status')
    return {
      search: params.get('q') ?? undefined,
      status: status && status in applicationStatusLabels ? (status as ApplicationStatus) : undefined,
      sort: params.get('sort') === 'oldest' ? ('oldest' as const) : ('newest' as const),
      page: Math.max(1, Number(params.get('page')) || 1),
      perPage: 8,
    } satisfies ApplicationQuery
  }, [params])

  const [searchInput, setSearchInput] = useState(query.search ?? '')
  const { data, error, loading, retry } = useAsync(() => getApplications(query), [JSON.stringify(query)])

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

  const hasFilters = Boolean(query.search?.trim() || query.status)

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

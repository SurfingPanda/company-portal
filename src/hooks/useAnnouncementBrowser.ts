import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ANNOUNCEMENT_PAGE_SIZE, announcementCategories, announcementSortOptions, dateRangeOptions } from '@/data/announcementCategories'
import { departmentOptions } from '@/data/directoryOptions'
import { useAsync } from '@/hooks/useAsync'
import { getAnnouncements } from '@/services/announcementService'
import type { AnnouncementPriority, AnnouncementQuery } from '@/types/announcement'

const PRIORITIES: AnnouncementPriority[] = ['normal', 'important', 'urgent']

/** Search, filter, sort and page state for announcements, kept in the URL so views can be shared. */
export function useAnnouncementBrowser() {
  const [params, setParams] = useSearchParams()

  const query = useMemo(() => {
    const priority = params.get('priority') as AnnouncementPriority | null
    return {
      search: params.get('q') ?? undefined,
      category: announcementCategories.find((c) => c.id === params.get('category'))?.id,
      department: departmentOptions.find((d) => d === params.get('department')),
      priority: priority && PRIORITIES.includes(priority) ? priority : undefined,
      status: params.get('status') === 'archived' ? ('archived' as const) : ('published' as const),
      range: dateRangeOptions.find((r) => r.value === params.get('range'))?.value ?? ('any' as const),
      sort: announcementSortOptions.find((s) => s.value === params.get('sort'))?.value ?? ('newest' as const),
      page: Math.max(1, Number(params.get('page')) || 1),
      perPage: ANNOUNCEMENT_PAGE_SIZE,
    } satisfies AnnouncementQuery
  }, [params])

  const [searchInput, setSearchInput] = useState(query.search ?? '')
  const { data, error, loading, retry } = useAsync(() => getAnnouncements(query), [JSON.stringify(query)])

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

  const hasFilters = Boolean(query.search?.trim() || query.category || query.department || query.priority || query.status !== 'published' || query.range !== 'any')

  const clearFilters = () => {
    setSearchInput('')
    setParams((prev) => {
      const next = new URLSearchParams()
      const sort = prev.get('sort') // keep the chosen sort
      if (sort) next.set('sort', sort)
      return next
    })
  }

  return { query, data, error, loading, retry, searchInput, setSearchInput, update, hasFilters, clearFilters }
}

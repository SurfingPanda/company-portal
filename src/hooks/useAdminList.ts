import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import type { ListParams } from '@/services/admin/adminApi'
import type { AdminPage } from '@/types/admin'

/**
 * State of an administration list kept in the URL (so a filtered view can be bookmarked or reloaded): page, search, sort,
 * direction and any filter keys. Data is fetched from Laravel with those parameters; nothing is filtered in the browser.
 */
export function useAdminList<T>(fetcher: (params: ListParams) => Promise<AdminPage<T>>, filterKeys: readonly string[] = [], defaults: { sort?: string; direction?: 'asc' | 'desc' } = {}) {
  const [search, setSearch] = useSearchParams()

  const params = useMemo<ListParams>(() => {
    const result: ListParams = { page: Number(search.get('page')) || 1, per_page: 20 }
    const q = search.get('q')
    if (q) result.search = q
    const sort = search.get('sort') ?? defaults.sort
    if (sort) {
      result.sort = sort
      result.direction = (search.get('direction') as 'asc' | 'desc' | null) ?? defaults.direction ?? 'desc'
    }
    for (const key of filterKeys) {
      const value = search.get(key)
      if (value) result[key] = value
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const state = useAsync(() => fetcher(params), [JSON.stringify(params)])

  /** Change URL parameters; any change except `page` itself returns to page 1. */
  const update = useCallback(
    (changes: Record<string, string | undefined>) => {
      setSearch(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearch],
  )

  return { ...state, params, update, search: search.get('q') ?? '' }
}

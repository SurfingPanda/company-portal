import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { requestCategories } from '@/data/requestCategories'
import { useAsync } from '@/hooks/useAsync'
import { getCatalog } from '@/services/formService'
import type { CatalogQuery } from '@/types/form'

/** Search and filters for the Forms page. State lives in the URL (?q=&type=&category=&status=). */
export function useFormBrowser() {
  const [params, setParams] = useSearchParams()

  const query = useMemo<CatalogQuery>(() => {
    const type = params.get('type')
    const status = params.get('status')
    const category = params.get('category')
    return {
      search: params.get('q') ?? undefined,
      kind: type === 'form' || type === 'request' ? type : undefined,
      category: requestCategories.find((c) => c.id === category)?.id,
      status: status === 'available' || status === 'coming-soon' ? status : undefined,
    }
  }, [params])

  const [searchInput, setSearchInput] = useState(query.search ?? '')
  const { data, error, retry } = useAsync(() => getCatalog(query), [JSON.stringify(query)])

  const update = (changes: Record<string, string | undefined>, replace = false) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
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

  const hasFilters = Boolean(query.search?.trim() || query.kind || query.category || query.status)

  const clearFilters = () => {
    setSearchInput('')
    setParams({})
  }

  return { query, data, error, retry, searchInput, setSearchInput, update, hasFilters, clearFilters }
}

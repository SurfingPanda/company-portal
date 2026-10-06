import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DOCUMENT_PAGE_SIZE, documentCategories, fileTypeOptions, sortOptions } from '@/data/documentCategories'
import { useAsync } from '@/hooks/useAsync'
import { getDocuments } from '@/services/documentService'
import type { DocumentCategory, DocumentFileType, DocumentQuery, DocumentSort } from '@/types/document'

/**
 * Search/filter/sort/page state for document lists, stored in the URL so views can be shared.
 * Pass `fixedCategory` for category pages: the category is then locked and not a user filter.
 */
export function useDocumentBrowser(fixedCategory?: DocumentCategory) {
  const [params, setParams] = useSearchParams()

  const query = useMemo<DocumentQuery & { sort: DocumentSort }>(() => {
    const category = params.get('category')
    const type = params.get('type')
    const sort = params.get('sort')
    return {
      search: params.get('q') ?? undefined,
      category: fixedCategory ?? documentCategories.find((c) => c.id === category)?.id,
      department: params.get('department') ?? undefined,
      fileType: fileTypeOptions.find((t) => t === type) as DocumentFileType | undefined,
      sort: sortOptions.find((s) => s.value === sort)?.value ?? 'updated',
      page: Math.max(1, Number(params.get('page')) || 1),
      perPage: DOCUMENT_PAGE_SIZE,
    }
  }, [params, fixedCategory])

  const [searchInput, setSearchInput] = useState(query.search ?? '')
  const { data, error, loading, retry } = useAsync(() => getDocuments(query), [JSON.stringify(query)])

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

  // Debounce typing into the URL; keep the input in step with the URL (back/forward, clear).
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

  const hasFilters = Boolean(
    query.search?.trim() || (!fixedCategory && query.category) || query.department || query.fileType,
  )

  const clearFilters = () => {
    setSearchInput('')
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      ;['q', 'category', 'department', 'type', 'page'].forEach((key) => next.delete(key))
      return next
    })
  }

  return {
    query,
    data,
    error,
    loading,
    retry,
    searchInput,
    setSearchInput,
    update,
    hasFilters,
    clearFilters,
    showAll: params.get('view') === 'all',
  }
}

export type DocumentBrowser = ReturnType<typeof useDocumentBrowser>

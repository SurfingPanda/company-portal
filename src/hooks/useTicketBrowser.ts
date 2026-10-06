import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TICKET_PAGE_SIZE, ticketCategoryOptions, ticketPriorityLabels, ticketSortOptions, ticketStatusLabels } from '@/data/helpdeskOptions'
import { useAsync } from '@/hooks/useAsync'
import { getTickets } from '@/services/helpdeskService'
import type { TicketPriority, TicketQuery, TicketStatus } from '@/types/helpdesk'

/** Ticket search, filters, sort and page, kept in the URL. */
export function useTicketBrowser() {
  const [params, setParams] = useSearchParams()

  const query = useMemo(() => {
    const status = params.get('status')
    const priority = params.get('priority')
    return {
      search: params.get('q') ?? undefined,
      status: status && status in ticketStatusLabels ? (status as TicketStatus) : undefined,
      category: ticketCategoryOptions.find((c) => c.value === params.get('category'))?.value,
      priority: priority && priority in ticketPriorityLabels ? (priority as TicketPriority) : undefined,
      sort: ticketSortOptions.find((s) => s.value === params.get('sort'))?.value ?? ('updated' as const),
      page: Math.max(1, Number(params.get('page')) || 1),
      perPage: TICKET_PAGE_SIZE,
    } satisfies TicketQuery
  }, [params])

  const [searchInput, setSearchInput] = useState(query.search ?? '')
  const { data, error, loading, retry } = useAsync(() => getTickets(query), [JSON.stringify(query)])

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

  const hasFilters = Boolean(query.search?.trim() || query.status || query.category || query.priority)

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

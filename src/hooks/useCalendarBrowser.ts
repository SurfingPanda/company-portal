import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { CalendarView } from '@/components/calendar/CalendarToolbar'
import { departmentOptions } from '@/data/directoryOptions'
import { eventCategories } from '@/data/eventCategories'
import { useAsync } from '@/hooks/useAsync'
import {
  addDays,
  addMonths,
  endOfMonth,
  formatMonthYear,
  formatWeekRange,
  getMonthGrid,
  getWeekDays,
  isSameMonth,
  isValidISODate,
  startOfMonth,
  toISODate,
} from '@/lib/calendar'
import { getEvents } from '@/services/eventService'
import type { EventCategory } from '@/types/event'

const VIEWS: CalendarView[] = ['month', 'week', 'list']

/**
 * Calendar state kept in the URL: ?view=&date=&q=&category=&department=
 * `date` is the anchor day for the visible month/week; it defaults to today.
 */
export function useCalendarBrowser() {
  const [params, setParams] = useSearchParams()
  const today = toISODate(new Date())

  // Phones default to the readable list; larger screens default to the month grid.
  const [defaultView] = useState<CalendarView>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'list' : 'month',
  )

  const viewParam = params.get('view') as CalendarView | null
  const view = viewParam && VIEWS.includes(viewParam) ? viewParam : defaultView
  const dateParam = params.get('date')
  const anchor = isValidISODate(dateParam) ? dateParam : today

  const categoryParam = params.get('category')
  const departmentParam = params.get('department')
  const category = eventCategories.find((c) => c.id === categoryParam)?.id
  const department = departmentOptions.find((d) => d === departmentParam)
  const search = params.get('q') ?? undefined

  // Date range to load: whole grid for month, the week for week, the month for list.
  const range = useMemo(() => {
    if (view === 'week') {
      const days = getWeekDays(anchor)
      return { from: days[0], to: days[6] }
    }
    if (view === 'month') {
      const grid = getMonthGrid(anchor)
      return { from: grid[0], to: grid[grid.length - 1] }
    }
    return { from: startOfMonth(anchor), to: endOfMonth(anchor) }
  }, [view, anchor])

  const query = useMemo(() => ({ search, category, department, ...range }), [search, category, department, range])
  const { data, error, loading, retry } = useAsync(() => getEvents(query), [JSON.stringify(query)])

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

  const [searchInput, setSearchInput] = useState(search ?? '')
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

  const setAnchor = (iso: string) => update({ date: iso === today ? undefined : iso })
  const goPrevious = () => setAnchor(view === 'week' ? addDays(anchor, -7) : addMonths(anchor, -1))
  const goNext = () => setAnchor(view === 'week' ? addDays(anchor, 7) : addMonths(anchor, 1))
  const goToday = () => update({ date: undefined })

  const hasFilters = Boolean(search?.trim() || category || department)
  const clearFilters = () => {
    setSearchInput('')
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      ;['q', 'category', 'department'].forEach((key) => next.delete(key))
      return next
    })
  }

  return {
    today,
    view,
    anchor,
    title: view === 'week' ? formatWeekRange(anchor) : formatMonthYear(anchor),
    isCurrentPeriod: view === 'week' ? getWeekDays(anchor).includes(today) : isSameMonth(anchor, today),
    events: data,
    error,
    loading,
    retry,
    searchInput,
    setSearchInput,
    category,
    department,
    setView: (next: CalendarView) => update({ view: next === defaultView ? undefined : next }),
    setCategory: (next: EventCategory | undefined) => update({ category: next }),
    setDepartment: (next: string | undefined) => update({ department: next }),
    goPrevious,
    goNext,
    goToday,
    hasFilters,
    clearFilters,
  }
}

export type CalendarBrowser = ReturnType<typeof useCalendarBrowser>

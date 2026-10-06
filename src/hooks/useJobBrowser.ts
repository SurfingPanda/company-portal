import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { jobSortOptions } from '@/components/recruitment/JobFilters'
import { departmentOptions, employmentTypeOptions, locationOptions, workArrangementOptions } from '@/data/jobs'
import { useAsync } from '@/hooks/useAsync'
import { jobStatusOptions } from '@/lib/recruitment'
import { getJobs } from '@/services/recruitmentService'
import type { JobQuery, JobStatusFilter } from '@/types/recruitment'

/** Job search, filters and sort, kept in the URL (?q=&dept=&type=&arrangement=&location=&status=&sort=). Only Open positions show by default. */
export function useJobBrowser() {
  const [params, setParams] = useSearchParams()

  const query = useMemo(() => {
    const status = params.get('status')
    return {
      search: params.get('q') ?? undefined,
      department: departmentOptions.find((d) => d === params.get('dept')),
      employmentType: employmentTypeOptions.find((t) => t === params.get('type')),
      workArrangement: workArrangementOptions.find((w) => w === params.get('arrangement')),
      location: locationOptions.find((l) => l === params.get('location')),
      status: (status === 'all' || jobStatusOptions.some((s) => s === status) ? status : 'open') as JobStatusFilter,
      sort: jobSortOptions.find((s) => s.value === params.get('sort'))?.value ?? ('newest' as const),
    } satisfies JobQuery
  }, [params])

  const [searchInput, setSearchInput] = useState(query.search ?? '')
  const { data, error, loading, retry } = useAsync(() => getJobs(query), [JSON.stringify(query)])

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

  const hasFilters = Boolean(query.search?.trim() || query.department || query.employmentType || query.workArrangement || query.location || query.status !== 'open')

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

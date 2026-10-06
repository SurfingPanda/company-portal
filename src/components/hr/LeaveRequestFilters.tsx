import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { leaveSortOptions } from '@/hooks/useLeaveRequestBrowser'
import { requestStatusLabels } from '@/data/requestCategories'
import type { LeaveRequestQuery, LeaveSort } from '@/types/hr'

const ALL = 'all'
const labelClass = 'mb-1 block text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground'

interface LeaveRequestFiltersProps {
  query: LeaveRequestQuery & { sort: LeaveSort }
  search: string
  onSearchChange: (value: string) => void
  onChange: (changes: Record<string, string | undefined>) => void
}

/** Search, status, date range and sort for the leave request list. */
export function LeaveRequestFilters({ query, search, onSearchChange, onChange }: LeaveRequestFiltersProps) {
  const dateInvalid = Boolean(query.from && query.to && query.to < query.from)

  return (
    <div className="space-y-4">
      <div role="search">
        <label htmlFor="leave-search" className="sr-only">
          Search leave requests by reference, type or reason
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
          <Input
            id="leave-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leave requests..."
            autoComplete="off"
            className="h-12 border-primary/40 bg-white pl-12 pr-11 text-base md:text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-0 flex-1 basis-40">
          <label htmlFor="leave-status" className={labelClass}>
            Status
          </label>
          <Select value={query.status ?? ALL} onValueChange={(v) => onChange({ status: v === ALL ? undefined : v })}>
            <SelectTrigger id="leave-status" className="h-9 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Statuses</SelectItem>
              {Object.entries(requestStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 flex-1 basis-36">
          <label htmlFor="leave-from" className={labelClass}>
            Leave From
          </label>
          <Input id="leave-from" type="date" value={query.from ?? ''} onChange={(e) => onChange({ from: e.target.value || undefined })} className="h-9 bg-white" />
        </div>
        <div className="min-w-0 flex-1 basis-36">
          <label htmlFor="leave-to" className={labelClass}>
            Leave To
          </label>
          <Input
            id="leave-to"
            type="date"
            value={query.to ?? ''}
            min={query.from}
            onChange={(e) => onChange({ to: e.target.value || undefined })}
            aria-invalid={dateInvalid}
            aria-describedby={dateInvalid ? 'leave-date-error' : undefined}
            className="h-9 bg-white"
          />
        </div>

        <div className="min-w-0 flex-1 basis-44">
          <label htmlFor="leave-sort" className={labelClass}>
            Sort
          </label>
          <Select value={query.sort} onValueChange={(v) => onChange({ sort: v === 'submitted-desc' ? undefined : v })}>
            <SelectTrigger id="leave-sort" className="h-9 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {leaveSortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {dateInvalid && (
        <p id="leave-date-error" role="alert" className="text-sm font-medium text-destructive">
          <span aria-hidden="true">⚠ </span>
          &quot;Leave To&quot; cannot be earlier than &quot;Leave From&quot;.
        </p>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterDef {
  key: string
  label: string
  /** Choices of a select filter. */
  options: FilterOption[]
  /** `text` and `date` filters apply when the field loses focus or Enter is pressed. Default: select. */
  type?: 'select' | 'text' | 'date'
  /** Load the choices from Laravel (e.g. the departments that exist) instead of listing them in code. */
  load?: () => Promise<FilterOption[]>
}

interface AdminFiltersProps {
  /** Current search text (from the URL). */
  search: string
  searchLabel?: string
  filters?: FilterDef[]
  values: Record<string, string | number | boolean | undefined>
  onChange: (changes: Record<string, string | undefined>) => void
}

/** Search box (debounced, sent to the server) and filter selects. Native selects: fully keyboard and screen-reader accessible. */
export function AdminFilters({ search, searchLabel = 'Search', filters = [], values, onChange }: AdminFiltersProps) {
  const [text, setText] = useState(search)
  useEffect(() => setText(search), [search])
  useEffect(() => {
    if (text === search) return
    const timer = setTimeout(() => onChange({ q: text.trim() || undefined }), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-4 flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1 sm:max-w-sm">
        <label htmlFor="admin-search" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {searchLabel}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="admin-search" type="search" value={text} maxLength={100} onChange={(e) => setText(e.target.value)} className="h-9 bg-white pl-8" />
        </div>
      </div>
      {filters.map((f) => f.type === 'text' || f.type === 'date' ? (
        <div key={f.key}>
          <label htmlFor={`admin-filter-${f.key}`} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {f.label}
          </label>
          <input
            id={`admin-filter-${f.key}`}
            type={f.type}
            defaultValue={String(values[f.key] ?? '')}
            maxLength={32}
            onBlur={(e) => e.target.value !== String(values[f.key] ?? '') && onChange({ [f.key]: e.target.value.trim() || undefined })}
            onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur())}
            className="h-9 w-40 border border-input bg-white px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
          />
        </div>
      ) : (
        <div key={f.key}>
          <label htmlFor={`admin-filter-${f.key}`} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {f.label}
          </label>
          <select
            id={`admin-filter-${f.key}`}
            value={String(values[f.key] ?? '')}
            onChange={(e) => onChange({ [f.key]: e.target.value || undefined })}
            className="h-9 border border-input bg-white px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
          >
            <option value="">All</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </form>
  )
}

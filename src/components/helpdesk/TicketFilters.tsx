import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ticketCategoryOptions, ticketPriorityLabels, ticketSortOptions, ticketStatusLabels } from '@/data/helpdeskOptions'
import type { TicketQuery } from '@/types/helpdesk'

const ALL = 'all'

function FilterSelect({ id, label, value, onValueChange, options }: { id: string; label: string; value: string; onValueChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="min-w-0 flex-1 basis-40">
      <label htmlFor={id} className="mb-1 block text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="h-9 w-full bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface TicketFiltersProps {
  query: TicketQuery & { sort: NonNullable<TicketQuery['sort']> }
  search: string
  onSearchChange: (value: string) => void
  onChange: (changes: Record<string, string | undefined>) => void
}

/** Search by reference, subject, description or category, plus status, category, priority and sort. */
export function TicketFilters({ query, search, onSearchChange, onChange }: TicketFiltersProps) {
  const unlessAll = (v: string) => (v === ALL ? undefined : v)

  return (
    <div className="space-y-4">
      <div role="search">
        <label htmlFor="ticket-search" className="sr-only">
          Search tickets by reference, subject, description or category
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
          <Input
            id="ticket-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tickets..."
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
        <FilterSelect id="tk-status" label="Status" value={query.status ?? ALL} onValueChange={(v) => onChange({ status: unlessAll(v) })} options={[{ value: ALL, label: 'All Statuses' }, ...Object.entries(ticketStatusLabels).map(([value, label]) => ({ value, label }))]} />
        <FilterSelect id="tk-category" label="Category" value={query.category ?? ALL} onValueChange={(v) => onChange({ category: unlessAll(v) })} options={[{ value: ALL, label: 'All Categories' }, ...ticketCategoryOptions]} />
        <FilterSelect id="tk-priority" label="Priority" value={query.priority ?? ALL} onValueChange={(v) => onChange({ priority: unlessAll(v) })} options={[{ value: ALL, label: 'All Priorities' }, ...Object.entries(ticketPriorityLabels).map(([value, label]) => ({ value, label }))]} />
        <FilterSelect id="tk-sort" label="Sort" value={query.sort} onValueChange={(v) => onChange({ sort: v === 'updated' ? undefined : v })} options={ticketSortOptions} />
      </div>
    </div>
  )
}

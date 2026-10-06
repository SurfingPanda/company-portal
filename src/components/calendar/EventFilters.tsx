import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { departmentOptions } from '@/data/directoryOptions'
import { eventCategories } from '@/data/eventCategories'
import type { EventCategory } from '@/types/event'

const ALL = 'all'

interface EventFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  category?: EventCategory
  department?: string
  onCategoryChange: (category: EventCategory | undefined) => void
  onDepartmentChange: (department: string | undefined) => void
}

function FilterSelect({ id, label, value, onValueChange, allLabel, options }: { id: string; label: string; value: string; onValueChange: (v: string) => void; allLabel: string; options: { value: string; label: string }[] }) {
  return (
    <div className="min-w-0 flex-1 basis-44">
      <label htmlFor={id} className="mb-1 block text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="h-9 w-full bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
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

/** Search plus Category and Department filters. Date filtering happens through the calendar navigation. */
export function EventFilters({ search, onSearchChange, category, department, onCategoryChange, onDepartmentChange }: EventFiltersProps) {
  return (
    <div className="space-y-4">
      <div role="search">
        <label htmlFor="event-search" className="sr-only">
          Search events
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
          <Input
            id="event-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events..."
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
        <FilterSelect
          id="event-filter-category"
          label="Category"
          value={category ?? ALL}
          onValueChange={(v) => onCategoryChange(v === ALL ? undefined : (v as EventCategory))}
          allLabel="All Categories"
          options={eventCategories.map((c) => ({ value: c.id, label: c.label }))}
        />
        <FilterSelect
          id="event-filter-department"
          label="Department"
          value={department ?? ALL}
          onValueChange={(v) => onDepartmentChange(v === ALL ? undefined : v)}
          allLabel="All Departments"
          options={departmentOptions.map((d) => ({ value: d, label: d }))}
        />
      </div>
    </div>
  )
}

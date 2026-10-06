import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { hrServiceCategories } from '@/data/hrServices'
import type { HRServiceCategory } from '@/types/hr'

const ALL = 'all'

interface HRServiceFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  category?: HRServiceCategory
  onCategoryChange: (category?: HRServiceCategory) => void
}

/** Search plus a category filter for HR services. */
export function HRServiceFilters({ search, onSearchChange, category, onCategoryChange }: HRServiceFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
      <div role="search">
        <label htmlFor="hr-service-search" className="mb-1 block text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
          Search
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
          <Input
            id="hr-service-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search HR services..."
            autoComplete="off"
            className="h-9 bg-white pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="hr-service-category" className="mb-1 block text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
          Category
        </label>
        <Select value={category ?? ALL} onValueChange={(v) => onCategoryChange(v === ALL ? undefined : (v as HRServiceCategory))}>
          <SelectTrigger id="hr-service-category" className="h-9 w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Categories</SelectItem>
            {hrServiceCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

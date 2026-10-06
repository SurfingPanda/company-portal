import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { requestCategories } from '@/data/requestCategories'
import type { CatalogQuery } from '@/types/form'
import type { RequestCategory } from '@/types/request'

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

interface FormFiltersProps {
  query: CatalogQuery
  onChange: (changes: Record<string, string | undefined>) => void
}

export function FormFilters({ query, onChange }: FormFiltersProps) {
  const unlessAll = (v: string) => (v === ALL ? undefined : v)
  return (
    <div className="flex flex-wrap gap-3">
      <FilterSelect
        id="filter-type"
        label="Type"
        value={query.kind ?? ALL}
        onValueChange={(v) => onChange({ type: unlessAll(v) })}
        options={[{ value: ALL, label: 'All' }, { value: 'form', label: 'Forms' }, { value: 'request', label: 'Requests' }]}
      />
      <FilterSelect
        id="filter-category"
        label="Category"
        value={query.category ?? ALL}
        onValueChange={(v) => onChange({ category: unlessAll(v) as RequestCategory | undefined })}
        options={[{ value: ALL, label: 'All' }, ...requestCategories.map((c) => ({ value: c.id, label: c.label }))]}
      />
      <FilterSelect
        id="filter-status"
        label="Status"
        value={query.status ?? ALL}
        onValueChange={(v) => onChange({ status: unlessAll(v) })}
        options={[{ value: ALL, label: 'All' }, { value: 'available', label: 'Available' }, { value: 'coming-soon', label: 'Coming Soon' }]}
      />
    </div>
  )
}

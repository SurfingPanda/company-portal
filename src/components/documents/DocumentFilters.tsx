import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { documentCategories, fileTypeOptions, sortOptions } from '@/data/documentCategories'
import { departmentOptions } from '@/data/directoryOptions'
import type { DocumentFileType, DocumentQuery, DocumentSort } from '@/types/document'

const ALL = 'all'

interface FilterSelectProps {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
}

function FilterSelect({ id, label, value, onValueChange, options }: FilterSelectProps) {
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

interface DocumentFiltersProps {
  query: DocumentQuery & { sort: DocumentSort }
  onChange: (changes: Record<string, string | undefined>) => void
  /** Hide the category filter on category pages, where the category is fixed. */
  hideCategory?: boolean
}

export function DocumentFilters({ query, onChange, hideCategory = false }: DocumentFiltersProps) {
  const orAll = (value: string | undefined) => value ?? ALL
  const unlessAll = (value: string) => (value === ALL ? undefined : value)

  return (
    <div className="flex flex-wrap gap-3">
      {!hideCategory && (
        <FilterSelect
          id="doc-filter-category"
          label="Category"
          value={orAll(query.category)}
          onValueChange={(v) => onChange({ category: unlessAll(v) })}
          options={[{ value: ALL, label: 'All Categories' }, ...documentCategories.map((c) => ({ value: c.id, label: c.label }))]}
        />
      )}
      <FilterSelect
        id="doc-filter-department"
        label="Department"
        value={orAll(query.department)}
        onValueChange={(v) => onChange({ department: unlessAll(v) })}
        options={[{ value: ALL, label: 'All Departments' }, ...departmentOptions.map((d) => ({ value: d, label: d }))]}
      />
      <FilterSelect
        id="doc-filter-type"
        label="File Type"
        value={orAll(query.fileType)}
        onValueChange={(v) => onChange({ type: unlessAll(v) as DocumentFileType | undefined })}
        options={[{ value: ALL, label: 'All Types' }, ...fileTypeOptions.map((t) => ({ value: t, label: t }))]}
      />
      <FilterSelect
        id="doc-sort"
        label="Sort"
        value={query.sort}
        onValueChange={(v) => onChange({ sort: v === 'updated' ? undefined : v })}
        options={sortOptions}
      />
    </div>
  )
}

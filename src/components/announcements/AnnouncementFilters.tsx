import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { announcementCategories, announcementSortOptions, dateRangeOptions, priorityLabels } from '@/data/announcementCategories'
import { departmentOptions } from '@/data/directoryOptions'
import type { AnnouncementQuery } from '@/types/announcement'

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

interface AnnouncementFiltersProps {
  query: AnnouncementQuery & { sort: NonNullable<AnnouncementQuery['sort']>; status: NonNullable<AnnouncementQuery['status']>; range: NonNullable<AnnouncementQuery['range']> }
  onChange: (changes: Record<string, string | undefined>) => void
}

/** Category, department, priority, publication status, date range and sort. Employees never see drafts. */
export function AnnouncementFilters({ query, onChange }: AnnouncementFiltersProps) {
  const unlessAll = (v: string) => (v === ALL ? undefined : v)

  return (
    <div className="flex flex-wrap gap-3">
      <FilterSelect id="ann-category" label="Category" value={query.category ?? ALL} onValueChange={(v) => onChange({ category: unlessAll(v) })} options={[{ value: ALL, label: 'All Categories' }, ...announcementCategories.map((c) => ({ value: c.id, label: c.label }))]} />
      <FilterSelect id="ann-department" label="Department" value={query.department ?? ALL} onValueChange={(v) => onChange({ department: unlessAll(v) })} options={[{ value: ALL, label: 'All Departments' }, ...departmentOptions.map((d) => ({ value: d, label: d }))]} />
      <FilterSelect id="ann-priority" label="Priority" value={query.priority ?? ALL} onValueChange={(v) => onChange({ priority: unlessAll(v) })} options={[{ value: ALL, label: 'All Priorities' }, ...(['normal', 'important', 'urgent'] as const).map((p) => ({ value: p, label: priorityLabels[p] }))]} />
      <FilterSelect id="ann-status" label="Status" value={query.status} onValueChange={(v) => onChange({ status: v === 'published' ? undefined : v })} options={[{ value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
      <FilterSelect id="ann-range" label="Date" value={query.range} onValueChange={(v) => onChange({ range: v === 'any' ? undefined : v })} options={dateRangeOptions} />
      <FilterSelect id="ann-sort" label="Sort" value={query.sort} onValueChange={(v) => onChange({ sort: v === 'newest' ? undefined : v })} options={announcementSortOptions} />
    </div>
  )
}

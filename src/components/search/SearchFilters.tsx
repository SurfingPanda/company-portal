import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SearchResultType, SearchSort } from '@/types/search'

const ALL = 'all'
const labelClass = 'mb-1 block text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground'

const typeOrder: SearchResultType[] = ['document', 'form', 'service', 'benefit', 'announcement', 'event', 'helpdesk', 'job', 'resource', 'faq', 'company', 'directory']
export const typeFilterLabels: Record<SearchResultType, string> = {
  document: 'Documents', form: 'Forms', service: 'Services', benefit: 'Benefits', announcement: 'Announcements', event: 'Events', helpdesk: 'Helpdesk',
  job: 'Recruitment', resource: 'Resources', faq: 'FAQ', company: 'Company', directory: 'Directory',
}

export const sortLabels: Record<SearchSort, string> = { relevance: 'Relevance', newest: 'Newest', az: 'A–Z' }

interface SearchFiltersProps {
  type?: SearchResultType
  sort: SearchSort
  grouped: boolean
  counts: Partial<Record<SearchResultType, number>>
  total: number
  onChange: (changes: { type?: string; sort?: string; group?: string }) => void
}

/** Compact filter bar: result type (with counts), sort, and a group-by-type toggle. Selects work the same on desktop and mobile. */
export function SearchFilters({ type, sort, grouped, counts, total, onChange }: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1 basis-44">
        <label htmlFor="search-type" className={labelClass}>
          Show
        </label>
        <Select value={type ?? ALL} onValueChange={(v) => onChange({ type: v === ALL ? undefined : v })}>
          <SelectTrigger id="search-type" className="h-9 w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All ({total})</SelectItem>
            {typeOrder.map((t) => (
              <SelectItem key={t} value={t} disabled={!counts[t]}>
                {typeFilterLabels[t]} ({counts[t] ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0 flex-1 basis-36">
        <label htmlFor="search-sort" className={labelClass}>
          Sort
        </label>
        <Select value={sort} onValueChange={(v) => onChange({ sort: v === 'relevance' ? undefined : v })}>
          <SelectTrigger id="search-sort" className="h-9 w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(sortLabels) as SearchSort[]).map((s) => (
              <SelectItem key={s} value={s}>
                {sortLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex h-9 items-center gap-2">
        <Checkbox id="search-group" checked={grouped} onCheckedChange={(c) => onChange({ group: c === true ? '1' : undefined })} />
        <label htmlFor="search-group" className="text-sm">
          Group by type
        </label>
      </div>
    </div>
  )
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { resourceCategories } from '@/data/resources'
import { resourceTypeLabels } from '@/services/resourceService'
import type { ResourceCategoryId, ResourceType } from '@/types/resource'

const ALL = 'all'
const labelClass = 'mb-1 block text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground'

interface ResourceFiltersProps {
  category?: ResourceCategoryId
  type?: ResourceType
  onChange: (changes: { category?: string; type?: string }) => void
}

/** Category and resource-type filters: two compact selects side by side, stacked on narrow screens. */
export function ResourceFilters({ category, type, onChange }: ResourceFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="resource-category" className={labelClass}>
          Category
        </label>
        <Select value={category ?? ALL} onValueChange={(v) => onChange({ category: v === ALL ? undefined : v })}>
          <SelectTrigger id="resource-category" className="h-9 w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Categories</SelectItem>
            {resourceCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="resource-type" className={labelClass}>
          Resource Type
        </label>
        <Select value={type ?? ALL} onValueChange={(v) => onChange({ type: v === ALL ? undefined : v })}>
          <SelectTrigger id="resource-type" className="h-9 w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Types</SelectItem>
            {(Object.keys(resourceTypeLabels) as ResourceType[])
              .filter((t) => t !== 'external')
              .map((t) => (
                <SelectItem key={t} value={t}>
                  {resourceTypeLabels[t]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

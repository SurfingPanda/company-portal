import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { EmployeeSortField, SortDirection } from '@/types/employee'

interface DirectorySortProps {
  sortBy: EmployeeSortField
  sortDir: SortDirection
  onChange: (sortBy: EmployeeSortField, sortDir: SortDirection) => void
}

const options: { value: string; label: string }[] = [
  { value: 'name:asc', label: 'Name (A–Z)' },
  { value: 'name:desc', label: 'Name (Z–A)' },
  { value: 'department:asc', label: 'Department' },
  { value: 'position:asc', label: 'Position' },
]

/** Compact sort control for small screens, where the table headers are not available. */
export function DirectorySort({ sortBy, sortDir, onChange }: DirectorySortProps) {
  const current = `${sortBy}:${sortDir}`
  return (
    <Select
      value={options.some((o) => o.value === current) ? current : undefined}
      onValueChange={(v) => {
        const [field, dir] = v.split(':') as [EmployeeSortField, SortDirection]
        onChange(field, dir)
      }}
    >
      <SelectTrigger size="sm" aria-label="Sort employees" className="h-8 w-40 bg-white text-xs">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

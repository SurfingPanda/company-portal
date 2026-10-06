import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { statusOptions } from '@/data/directoryOptions'
import { useAsync } from '@/hooks/useAsync'
import { getDirectoryFilters } from '@/services/employeeService'
import type { EmployeeStatus } from '@/types/employee'

const ALL = 'all'

export interface DirectoryFilterValues {
  department?: string
  location?: string
  status?: EmployeeStatus
}

interface DirectoryFiltersProps {
  values: DirectoryFilterValues
  onChange: (values: DirectoryFilterValues) => void
}

interface FilterFieldProps {
  id: string
  label: string
  value: string
  onValueChange: (value: string | undefined) => void
  allLabel: string
  options: { value: string; label: string }[]
}

function FilterField({ id, label, value, onValueChange, allLabel, options }: FilterFieldProps) {
  return (
    <div className="min-w-0 flex-1 sm:max-w-56">
      <label htmlFor={id} className="mb-1 block text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={(v) => onValueChange(v === ALL ? undefined : v)}>
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

/** Department and location choices come from the directory source (Laravel in API mode), so they always match what exists. */
export function DirectoryFilters({ values, onChange }: DirectoryFiltersProps) {
  const { data } = useAsync(getDirectoryFilters, [])
  const departmentOptions = data?.departments ?? []
  const locationOptions = data?.locations ?? []

  return (
    <div className="flex flex-wrap gap-3">
      <FilterField
        id="filter-department"
        label="Department"
        value={values.department ?? ALL}
        onValueChange={(department) => onChange({ ...values, department })}
        allLabel="All Departments"
        options={departmentOptions.map((d) => ({ value: d, label: d }))}
      />
      <FilterField
        id="filter-location"
        label="Location"
        value={values.location ?? ALL}
        onValueChange={(location) => onChange({ ...values, location })}
        allLabel="All Locations"
        options={locationOptions.map((l) => ({ value: l, label: l === 'Other' ? 'Other Locations' : l }))}
      />
      {data?.showStatus !== false && (
        <FilterField
          id="filter-status"
          label="Status"
          value={values.status ?? ALL}
          onValueChange={(status) => onChange({ ...values, status: status as EmployeeStatus | undefined })}
          allLabel="All Statuses"
          options={statusOptions}
        />
      )}
    </div>
  )
}

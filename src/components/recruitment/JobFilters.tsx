import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { departmentOptions, employmentTypeOptions, locationOptions, workArrangementOptions } from '@/data/jobs'
import { jobStatusOptions } from '@/lib/recruitment'
import type { JobQuery, JobSort } from '@/types/recruitment'

const ALL = 'all'

export const jobSortOptions: { value: JobSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title-asc', label: 'Job Title A–Z' },
  { value: 'title-desc', label: 'Job Title Z–A' },
  { value: 'closing', label: 'Closing Date' },
]

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

const toOptions = (all: string, values: string[]) => [{ value: ALL, label: all }, ...values.map((v) => ({ value: v, label: v }))]

interface JobFiltersProps {
  query: JobQuery & { status: NonNullable<JobQuery['status']>; sort: JobSort }
  onChange: (changes: Record<string, string | undefined>) => void
}

/** Department, employment type, work arrangement, location, status and sort. Sample categories only. */
export function JobFilters({ query, onChange }: JobFiltersProps) {
  const unlessAll = (v: string) => (v === ALL ? undefined : v)

  return (
    <div className="flex flex-wrap gap-3">
      <FilterSelect id="job-dept" label="Department" value={query.department ?? ALL} onValueChange={(v) => onChange({ dept: unlessAll(v) })} options={toOptions('All Departments', departmentOptions)} />
      <FilterSelect id="job-type" label="Employment Type" value={query.employmentType ?? ALL} onValueChange={(v) => onChange({ type: unlessAll(v) })} options={toOptions('All Types', employmentTypeOptions)} />
      <FilterSelect id="job-arrangement" label="Work Arrangement" value={query.workArrangement ?? ALL} onValueChange={(v) => onChange({ arrangement: unlessAll(v) })} options={toOptions('All Arrangements', workArrangementOptions)} />
      <FilterSelect id="job-location" label="Location" value={query.location ?? ALL} onValueChange={(v) => onChange({ location: unlessAll(v) })} options={toOptions('All Locations', locationOptions)} />
      <FilterSelect
        id="job-status"
        label="Status"
        value={query.status}
        onValueChange={(v) => onChange({ status: v === 'open' ? undefined : v })}
        options={[{ value: 'open', label: 'Open positions' }, ...jobStatusOptions.map((s) => ({ value: s, label: s })), { value: 'all', label: 'All statuses' }]}
      />
      <FilterSelect id="job-sort" label="Sort" value={query.sort} onValueChange={(v) => onChange({ sort: v === 'newest' ? undefined : v })} options={jobSortOptions} />
    </div>
  )
}

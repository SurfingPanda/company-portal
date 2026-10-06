import { cn } from '@/lib/utils'
import type { DepartmentCount } from '@/types/employee'

interface DepartmentSummaryProps {
  departments: DepartmentCount[] | undefined
  selected?: string
  onSelect: (department: string | undefined) => void
}

export function DepartmentSummary({ departments, selected, onSelect }: DepartmentSummaryProps) {
  return (
    <section aria-labelledby="departments-heading">
      <h2 id="departments-heading" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">
        Departments
      </h2>
      <ul>
        {departments
          ? departments.map(({ department, count }) => {
              const active = selected === department
              return (
                <li key={department} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => onSelect(active ? undefined : department)}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 border-l-[3px] py-2 pl-2.5 pr-1 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                      active ? 'border-gold bg-accent font-semibold text-primary' : 'border-transparent text-foreground',
                    )}
                  >
                    <span>{department}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
                  </button>
                </li>
              )
            })
          : Array.from({ length: 7 }, (_, i) => (
              <li key={i} className="border-b border-border py-2.5">
                <span className="block h-4 w-3/4 animate-pulse bg-muted" />
              </li>
            ))}
      </ul>
    </section>
  )
}

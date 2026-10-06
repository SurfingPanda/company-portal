import { ArrowDown, ArrowUp } from 'lucide-react'
import { EmployeeMobileCard } from '@/components/directory/EmployeeMobileCard'
import { EmployeeRow } from '@/components/directory/EmployeeRow'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Employee, EmployeeSortField, SortDirection } from '@/types/employee'

interface DirectoryTableProps {
  employees: Employee[]
  sortBy: EmployeeSortField
  sortDir: SortDirection
  onSortChange: (field: EmployeeSortField) => void
  /** Dims the list while a new page of results loads. */
  busy?: boolean
}

interface SortHeadProps {
  field: EmployeeSortField
  label: string
  sortBy: EmployeeSortField
  sortDir: SortDirection
  onSortChange: (field: EmployeeSortField) => void
  className?: string
}

function SortHead({ field, label, sortBy, sortDir, onSortChange, className }: SortHeadProps) {
  const active = sortBy === field
  const Icon = sortDir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('h-10 text-[0.6875rem] font-semibold uppercase tracking-widest', className)}
    >
      <button
        type="button"
        onClick={() => onSortChange(field)}
        className={cn(
          'inline-flex items-center gap-1 uppercase tracking-widest hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
          active ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
        {active && <Icon className="size-3" aria-hidden="true" />}
      </button>
    </TableHead>
  )
}

const plainHead = 'h-10 text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground'

export function DirectoryTable({ employees, sortBy, sortDir, onSortChange, busy }: DirectoryTableProps) {
  const sortProps = { sortBy, sortDir, onSortChange }

  return (
    <div className={cn('border bg-white transition-opacity', busy && 'opacity-60')} aria-busy={busy}>
      <ul className="divide-y md:hidden" aria-label="Employees">
        {employees.map((employee) => (
          <li key={employee.id}>
            <EmployeeMobileCard employee={employee} />
          </li>
        ))}
      </ul>

      <Table className="hidden md:table">
        <TableHeader className="bg-secondary">
          <TableRow className="hover:bg-secondary">
            <SortHead field="name" label="Employee" {...sortProps} />
            <TableHead className={cn(plainHead, 'hidden xl:table-cell')}>ID</TableHead>
            <SortHead field="department" label="Department" {...sortProps} />
            <SortHead field="position" label="Position" {...sortProps} />
            <TableHead className={cn(plainHead, 'hidden md:table-cell')}>Location</TableHead>
            <TableHead className={cn(plainHead, 'hidden xl:table-cell')}>Contact</TableHead>
            <TableHead className={cn(plainHead, 'text-right')}>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <EmployeeRow key={employee.id} employee={employee} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

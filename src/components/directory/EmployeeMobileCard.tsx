import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmployeeAvatar } from '@/components/common/EmployeeAvatar'
import { StatusBadge } from '@/components/directory/StatusBadge'
import { getFullName } from '@/lib/employee'
import type { Employee } from '@/types/employee'

interface EmployeeMobileCardProps {
  employee: Employee
}

/** Compact list item used below the `md` breakpoint instead of a table row. */
export function EmployeeMobileCard({ employee }: EmployeeMobileCardProps) {
  const fullName = getFullName(employee)

  return (
    <Link
      to={`/directory/${employee.employeeId}`}
      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <EmployeeAvatar name={fullName} imageUrl={employee.avatarUrl} className="size-10" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-primary">{fullName}</span>
        <span className="block text-[0.8125rem] text-foreground/80">
          {employee.position} · {employee.department}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{employee.location}</span>
        {employee.status === 'on-leave' && <StatusBadge status={employee.status} className="mt-1" />}
        <span className="mt-1.5 block truncate text-xs text-primary">{employee.email}</span>
      </span>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

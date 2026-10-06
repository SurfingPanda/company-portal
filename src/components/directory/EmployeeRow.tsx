import { ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { EmployeeAvatar } from '@/components/common/EmployeeAvatar'
import { StatusBadge } from '@/components/directory/StatusBadge'
import { TableCell, TableRow } from '@/components/ui/table'
import { getFullName, maskEmployeeId } from '@/lib/employee'
import type { Employee } from '@/types/employee'

interface EmployeeRowProps {
  employee: Employee
}

export function EmployeeRow({ employee }: EmployeeRowProps) {
  const navigate = useNavigate()
  const fullName = getFullName(employee)
  const profilePath = `/directory/${employee.employeeId}`

  return (
    <TableRow className="cursor-pointer hover:bg-accent" onClick={() => navigate(profilePath)}>
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <EmployeeAvatar name={fullName} imageUrl={employee.avatarUrl} />
          <div className="min-w-0">
            <Link
              to={profilePath}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {fullName}
            </Link>
            <p className="truncate text-xs text-muted-foreground xl:hidden">{employee.email}</p>
            {employee.status === 'on-leave' && <StatusBadge status={employee.status} className="mt-0.5 hidden md:inline-block" />}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden font-mono text-xs text-muted-foreground xl:table-cell">{maskEmployeeId(employee.employeeId)}</TableCell>
      <TableCell className="text-sm">{employee.department}</TableCell>
      <TableCell className="whitespace-normal text-sm">{employee.position}</TableCell>
      <TableCell className="hidden text-sm md:table-cell">{employee.location}</TableCell>
      <TableCell className="hidden xl:table-cell">
        <a
          href={`mailto:${employee.email}`}
          onClick={(e) => e.stopPropagation()}
          className="block truncate text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {employee.email}
        </a>
        {employee.phone && <span className="block text-xs text-muted-foreground">{employee.phone}</span>}
      </TableCell>
      <TableCell className="text-right">
        <Link
          to={profilePath}
          onClick={(e) => e.stopPropagation()}
          aria-label={`View ${fullName}`}
          className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          View <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </TableCell>
    </TableRow>
  )
}

import { DetailSection } from '@/components/directory/DetailSection'
import { StatusBadge } from '@/components/directory/StatusBadge'
import { maskEmployeeId } from '@/lib/employee'
import type { Employee } from '@/types/employee'

/** Business employment information only. Never add salary, government IDs or other HR records here. */
export function EmployeeDetails({ employee }: { employee: Employee }) {
  return (
    <DetailSection
      title="Employment Information"
      items={[
        { label: 'Employee ID', value: <span className="font-mono">{maskEmployeeId(employee.employeeId)}</span> },
        { label: 'Department', value: employee.department },
        { label: 'Position', value: employee.position },
        { label: 'Location', value: employee.location },
        { label: 'Status', value: <StatusBadge status={employee.status} /> },
      ]}
    />
  )
}

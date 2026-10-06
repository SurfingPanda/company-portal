import { DepartmentCard } from '@/components/company/DepartmentCard'
import { cn } from '@/lib/utils'
import type { Department } from '@/types/company'

interface DepartmentListProps {
  departments: Department[]
  compact?: boolean
}

export function DepartmentList({ departments, compact = false }: DepartmentListProps) {
  return (
    <ul className={cn('grid border-l border-t bg-white', compact ? 'sm:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2')}>
      {departments.map((department) => (
        <li key={department.id} className="border-b border-r">
          <DepartmentCard department={department} compact={compact} />
        </li>
      ))}
    </ul>
  )
}

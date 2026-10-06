import type { EmployeeStatus } from '@/types/employee'

/** Filter options. These will come from the API (departments/locations endpoints) later. */
export const departmentOptions = [
  'MIS',
  'Human Resources',
  'Finance',
  'Operations',
  'Sales',
  'Marketing',
  'Administration',
]

export const locationOptions = ['Head Office', 'Branch', 'Warehouse', 'Other']

export const statusOptions: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'on-leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
]

export const statusLabels: Record<EmployeeStatus, string> = {
  active: 'Active',
  'on-leave': 'On Leave',
  inactive: 'Inactive',
}

export const DIRECTORY_PAGE_SIZE = 20

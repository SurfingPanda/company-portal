/**
 * Directory types. Only business-contact information is modelled on purpose:
 * no salary, government IDs, home address, bank or medical data.
 */

export type EmployeeStatus = 'active' | 'on-leave' | 'inactive'

export interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  department: string
  position: string
  email: string
  phone?: string
  location: string
  avatarUrl?: string
  status: EmployeeStatus
}

export type EmployeeSortField = 'name' | 'department' | 'position'
export type SortDirection = 'asc' | 'desc'

/** Query parameters that map 1:1 to a future `GET /api/employees` request. */
export interface EmployeeQuery {
  search?: string
  department?: string
  location?: string
  status?: EmployeeStatus
  sortBy?: EmployeeSortField
  sortDir?: SortDirection
  page?: number
  perPage?: number
}

/** Same envelope as a Laravel paginator response (defined in types/api.ts). */
export type { PaginatedResponse } from '@/types/api'

export interface DepartmentCount {
  department: string
  count: number
}

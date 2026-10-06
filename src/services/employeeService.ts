import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/employees.api'
import { departmentOptions, DIRECTORY_PAGE_SIZE, locationOptions } from '@/data/directoryOptions'
import { mockEmployees } from '@/data/mockEmployees'
import { getFullName } from '@/lib/employee'
import type { DepartmentCount, Employee, EmployeeQuery, PaginatedResponse } from '@/types/employee'

/**
 * Service layer for the employee directory.
 *
 * Today it reads from `mockEmployees`. When the Laravel API exists, replace each body with a
 * `fetch` call (e.g. `GET /api/employees?search=&department=&page=`) that returns the same shapes.
 * Components and hooks do not need to change.
 */

const MOCK_LATENCY_MS = 250
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function matchesSearch(employee: Employee, search: string) {
  const haystack = [
    getFullName(employee),
    `${employee.lastName} ${employee.firstName}`,
    employee.position,
    employee.department,
    employee.email,
    employee.employeeId,
  ]
    .join(' ')
    .toLowerCase()
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

function compare(a: Employee, b: Employee, sortBy: NonNullable<EmployeeQuery['sortBy']>) {
  const byName = a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
  if (sortBy === 'name') return byName
  const primary = sortBy === 'department' ? a.department.localeCompare(b.department) : a.position.localeCompare(b.position)
  return primary || byName
}

async function mockGetEmployees(query: EmployeeQuery = {}): Promise<PaginatedResponse<Employee>> {
  await wait(MOCK_LATENCY_MS)

  const { search, department, location, status, sortBy = 'name', sortDir = 'asc', page = 1, perPage = DIRECTORY_PAGE_SIZE } = query

  const filtered = mockEmployees
    .filter((e) => (search?.trim() ? matchesSearch(e, search) : true))
    .filter((e) => (department ? e.department === department : true))
    .filter((e) => (location ? e.location === location : true))
    .filter((e) => (status ? e.status === status : true))
    .sort((a, b) => (sortDir === 'asc' ? 1 : -1) * compare(a, b, sortBy))

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * perPage

  return {
    data: filtered.slice(start, start + perPage),
    current_page: currentPage,
    per_page: perPage,
    total,
    last_page: lastPage,
  }
}

async function mockGetEmployee(employeeId: string): Promise<Employee | null> {
  await wait(MOCK_LATENCY_MS)
  return mockEmployees.find((e) => e.employeeId.toLowerCase() === employeeId.toLowerCase()) ?? null
}

async function mockGetDepartmentSummary(): Promise<DepartmentCount[]> {
  await wait(MOCK_LATENCY_MS / 2)
  return departmentOptions.map((department) => ({
    department,
    count: mockEmployees.filter((e) => e.department === department).length,
  }))
}

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getEmployees: typeof mockGetEmployees = isApiMode ? apiAdapter.getEmployees : mockGetEmployees
export const getEmployee: typeof mockGetEmployee = isApiMode ? apiAdapter.getEmployee : mockGetEmployee
export const getDepartmentSummary: typeof mockGetDepartmentSummary = isApiMode ? apiAdapter.getDepartmentSummary : mockGetDepartmentSummary

/** Filter choices for the directory (departments and locations that exist; whether the status filter applies). */
async function mockGetDirectoryFilters(): Promise<{ departments: string[]; locations: string[]; showStatus: boolean }> {
  return { departments: departmentOptions, locations: locationOptions, showStatus: true }
}
export const getDirectoryFilters: typeof mockGetDirectoryFilters = isApiMode ? apiAdapter.getDirectoryFilters : mockGetDirectoryFilters

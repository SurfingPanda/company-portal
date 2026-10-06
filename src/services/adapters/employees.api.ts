import { DIRECTORY_PAGE_SIZE } from '@/data/directoryOptions'
import { api } from '@/services/api'
import { toPaginated, type ApiPage } from '@/services/adapters/paginate'
import type { ApiResponse } from '@/types/api'
import type { DepartmentCount, Employee, EmployeeQuery, PaginatedResponse } from '@/types/employee'

/**
 * Employee directory, Laravel adapter: GET /api/directory[/{employeeId}|/filters]. Laravel returns VISIBLE entries only, with
 * business information only (name, job title, department, company email, location, phone, description, employment status).
 */
interface ApiEntry {
  employee_id: string
  display_name: string
  job_title: string | null
  department: string | null
  location: string | null
  company_email: string | null
  employment_status: 'active' | 'on_leave' | 'inactive'
  phone: string | null
}

const toEmployee = (e: ApiEntry): Employee => {
  const [firstName, ...rest] = e.display_name.trim().split(/\s+/)
  return {
    id: e.employee_id,
    employeeId: e.employee_id,
    firstName,
    lastName: rest.join(' '),
    department: e.department ?? '',
    position: e.job_title ?? '',
    email: e.company_email ?? '',
    phone: e.phone ?? undefined,
    location: e.location ?? '',
    status: e.employment_status === 'on_leave' ? 'on-leave' : e.employment_status,
  }
}

export async function getEmployees(query: EmployeeQuery = {}): Promise<PaginatedResponse<Employee>> {
  const { search, department, location, status, sortBy = 'name', sortDir = 'asc', page = 1, perPage = DIRECTORY_PAGE_SIZE } = query
  const result = await api.get<ApiPage<ApiEntry>>('/api/directory', { search: search?.trim(), department, location, status: status === 'on-leave' ? 'on_leave' : status, sortBy, sortDir, page, per_page: perPage })
  return toPaginated(result, toEmployee)
}

export async function getEmployee(employeeId: string): Promise<Employee | null> {
  try {
    return toEmployee((await api.get<ApiResponse<ApiEntry>>(`/api/directory/${encodeURIComponent(employeeId)}`)).data)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

interface ApiFilters {
  departments: { name: string; count: number }[]
  locations: { name: string; count: number }[]
}

export async function getDepartmentSummary(): Promise<DepartmentCount[]> {
  const filters = (await api.get<ApiResponse<ApiFilters>>('/api/directory/filters')).data
  return filters.departments.map((d) => ({ department: d.name, count: d.count }))
}

export async function getDirectoryFilters(): Promise<{ departments: string[]; locations: string[]; showStatus: boolean }> {
  const filters = (await api.get<ApiResponse<ApiFilters>>('/api/directory/filters')).data
  return { departments: filters.departments.map((d) => d.name), locations: filters.locations.map((l) => l.name), showStatus: true }
}

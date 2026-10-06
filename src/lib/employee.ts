import type { Employee } from '@/types/employee'

export const getFullName = (employee: Pick<Employee, 'firstName' | 'lastName'>) =>
  `${employee.firstName} ${employee.lastName}`

/**
 * How an employee ID is shown to colleagues in the directory: the prefix and the first and last characters stay, the middle is
 * hidden ("EMP-9499" becomes "EMP-9**9", "EMP-025" becomes "EMP-0*5"). The full ID is still what the portal uses internally and
 * what HR and the person themselves see.
 */
export function maskEmployeeId(id: string): string {
  const dash = id.lastIndexOf('-')
  const prefix = dash >= 0 ? id.slice(0, dash + 1) : ''
  const rest = id.slice(dash + 1)
  if (rest.length <= 2) return `${prefix}${rest.slice(0, 1)}${'*'.repeat(Math.max(rest.length - 1, 1))}`
  return `${prefix}${rest[0]}${'*'.repeat(rest.length - 2)}${rest[rest.length - 1]}`
}

export type ActivityType = 'request' | 'document' | 'event' | 'service' | 'profile'

/** One entry in the employee's recent activity feed. Mock data only; no real browsing is recorded. */
export interface EmployeeActivity {
  id: string
  action: string
  description?: string
  type: ActivityType
  /** ISO date-time. */
  createdAt: string
  href?: string
  isSample?: boolean
}

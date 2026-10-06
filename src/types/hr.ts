import type { RequestStatus, RequestTimelineEntry } from '@/types/request'

export type HRServiceCategory = 'Leave' | 'Employee Records' | 'Benefits' | 'Documents' | 'HR Support' | 'Recruitment' | 'Other'

/** An employee-facing HR service. Shaped like a future `GET /api/hr/services` resource. */
export interface HRService {
  id: string
  name: string
  description: string
  category: HRServiceCategory
  type: 'request' | 'form' | 'information' | 'external'
  route?: string
  url?: string
  status: 'available' | 'coming-soon' | 'maintenance'

  isFeatured?: boolean
  /** True for example entries; they are not claims about official ELJIN HR services. */
  isSample?: boolean
}

export interface HRServiceQuery {
  search?: string
  category?: HRServiceCategory
}

/** SAMPLE leave type. Not an official ELJIN leave category or entitlement. */
export interface LeaveType {
  id: string
  name: string
}

/** Leave statuses are the shared request statuses (Phase 8), not a second status system. */
export type LeaveRequestStatus = RequestStatus

/**
 * Leave-shaped view of a request. The stored record is an ordinary `EmployeeRequest`
 * (request type `rt-leave`); this adds no second request store. No balances or entitlements here:
 * those are handled by HR.
 */
export interface LeaveRequest {
  id: string
  reference: string
  employeeId: string
  leaveType: string
  /** ISO date (yyyy-mm-dd). */
  startDate: string
  endDate: string
  reason: string
  contactNumber?: string
  contactEmail?: string
  attachmentName?: string
  attachmentSize?: string
  status: LeaveRequestStatus
  submittedAt?: string
  updatedAt: string
  assignedDepartment?: string
  timeline: RequestTimelineEntry[]
  isSample?: boolean
}

export type LeaveSort = 'submitted-desc' | 'submitted-asc' | 'start-asc' | 'start-desc'

export interface LeaveRequestQuery {
  search?: string
  status?: LeaveRequestStatus
  /** Show leave overlapping this range (ISO dates). */
  from?: string
  to?: string
  sort?: LeaveSort
  page?: number
  perPage?: number
}

export interface HRResourceLink {
  id: string
  label: string
  description: string
  href: string
}

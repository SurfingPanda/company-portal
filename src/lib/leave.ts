import { currentUser } from '@/data/currentUser'
import { formatDate } from '@/lib/format'
import type { LeaveRequest } from '@/types/hr'
import type { EmployeeRequest } from '@/types/request'

export const LEAVE_REQUEST_TYPE_ID = 'rt-leave'

export const isLeaveRequest = (request: EmployeeRequest) => request.requestTypeId === LEAVE_REQUEST_TYPE_ID

/**
 * Reads a stored request as a leave request. Returns null for records that are not leave requests
 * or lack the submitted values. Only copies what was submitted: no balances or entitlements.
 * The signed-in employee is the owner; the backend must enforce that once it exists.
 */
export function toLeaveRequest(request: EmployeeRequest): LeaveRequest | null {
  const values = request.values
  if (!isLeaveRequest(request) || !values) return null
  return {
    id: request.id,
    reference: request.reference,
    employeeId: currentUser.employeeId,
    leaveType: values['leave-type'] ?? request.title,
    startDate: values['start-date'] ?? '',
    endDate: values['end-date'] ?? '',
    reason: values.reason ?? request.description,
    contactNumber: values['contact-number'] || undefined,
    contactEmail: values['contact-email'] || undefined,
    attachmentName: request.attachments[0]?.name,
    attachmentSize: request.attachments[0]?.size,
    status: request.status,
    submittedAt: request.status === 'draft' ? undefined : request.submittedAt,
    updatedAt: request.updatedAt,
    assignedDepartment: request.assignedDepartment,
    timeline: request.timeline,
    isSample: request.isSample,
  }
}

/** "Oct 12, 2026" or "Oct 12 – Oct 14, 2026". */
export function formatDateRange(start: string, end: string) {
  if (!start) return '—'
  if (!end || start === end) return formatDate(start)
  return `${formatDate(start)} – ${formatDate(end)}`
}

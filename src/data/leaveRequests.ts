import { formatDate } from '@/lib/format'
import { buildHrTimeline, departmentForCategory } from '@/lib/requests'
import type { LeaveType } from '@/types/hr'
import type { EmployeeRequest, RequestAttachment, RequestStatus, SubmittedAnswer } from '@/types/request'

/**
 * SAMPLE DATA — NOT OFFICIAL ELJIN HR DATA.
 *
 * Leave types are generic examples, not ELJIN's official leave categories or entitlements.
 * Replaced by `GET /api/leave/types` once the backend provides the real list.
 */
export const leaveTypes: LeaveType[] = [
  { id: 'vacation', name: 'Vacation Leave' },
  { id: 'sick', name: 'Sick Leave' },
  { id: 'emergency', name: 'Emergency Leave' },
  { id: 'personal', name: 'Personal Leave' },
  { id: 'other', name: 'Other' },
]

const HR = departmentForCategory('hr')

function leave(
  n: number,
  leaveType: string,
  startDate: string,
  endDate: string,
  status: RequestStatus,
  submittedAt: string,
  updatedAt: string,
  reason: string,
  attachments: RequestAttachment[] = [],
  contactNumber?: string,
): EmployeeRequest {
  const reference = `LV-2026-${String(n).padStart(4, '0')}`
  const values: Record<string, string> = { 'leave-type': leaveType, 'start-date': startDate, 'end-date': endDate, reason }
  if (contactNumber) values['contact-number'] = contactNumber
  const answers: SubmittedAnswer[] = [
    { fieldId: 'leave-type', label: 'Leave type', value: leaveType },
    { fieldId: 'start-date', label: 'Date from', value: formatDate(startDate, 'long') },
    { fieldId: 'end-date', label: 'Date to', value: formatDate(endDate, 'long') },
    { fieldId: 'reason', label: 'Reason', value: reason },
    ...(contactNumber ? [{ fieldId: 'contact-number', label: 'Contact number during leave', value: contactNumber }] : []),
  ]
  return {
    id: reference,
    reference,
    requestTypeId: 'rt-leave',
    requestTypeTitle: 'Leave Request',
    category: 'hr',
    title: leaveType,
    description: reason,
    status,
    submittedAt,
    updatedAt,
    answers,
    values,
    attachments,
    timeline: buildHrTimeline(status, submittedAt, submittedAt, updatedAt, HR),
    currentStep: status === 'under-review' ? 'Under Review' : undefined,
    assignedDepartment: HR,
    approvedAt: status === 'approved' ? updatedAt : undefined,
    rejectedAt: status === 'rejected' ? updatedAt : undefined,
    completedAt: status === 'completed' ? updatedAt : undefined,
    isSample: true,
  }
}

/** SAMPLE requests of the mock signed-in employee. Nothing here is stored on a server. */
export const leaveRequests: EmployeeRequest[] = [
  leave(1, 'Vacation Leave', '2026-10-26', '2026-10-30', 'submitted', '2026-10-01T08:10:00', '2026-10-01T08:10:00', 'Family trip (sample).'),
  leave(2, 'Vacation Leave', '2026-10-12', '2026-10-14', 'approved', '2026-09-28T08:30:00', '2026-09-30T14:05:00', 'Short break (sample).'),
  leave(3, 'Sick Leave', '2026-09-16', '2026-09-17', 'completed', '2026-09-16T07:45:00', '2026-09-22T10:20:00', 'Sick leave', [{ id: 'att-lv3', name: 'supporting-document.pdf', size: '210 KB' }]),
  leave(4, 'Emergency Leave', '2026-09-08', '2026-09-08', 'completed', '2026-09-08T06:55:00', '2026-09-12T15:00:00', 'Family emergency (sample).', [], '+63 900 000 0000'),
  leave(5, 'Personal Leave', '2026-11-06', '2026-11-06', 'under-review', '2026-09-29T13:20:00', '2026-09-30T09:00:00', 'Personal errand (sample).'),
  leave(6, 'Vacation Leave', '2026-08-17', '2026-08-21', 'completed', '2026-07-30T09:00:00', '2026-08-24T08:30:00', 'Annual rest (sample).'),
  leave(7, 'Other', '2026-08-03', '2026-08-03', 'rejected', '2026-07-28T14:10:00', '2026-07-30T11:15:00', 'Sample reason for another type of leave.'),
  leave(8, 'Vacation Leave', '2026-07-13', '2026-07-15', 'cancelled', '2026-07-01T10:05:00', '2026-07-03T09:40:00', 'Plans changed (sample).'),
  leave(9, 'Sick Leave', '2026-06-02', '2026-06-03', 'completed', '2026-06-02T07:30:00', '2026-06-08T13:45:00', 'Sick leave'),
  leave(10, 'Personal Leave', '2026-05-19', '2026-05-19', 'completed', '2026-05-12T11:00:00', '2026-05-15T16:10:00', 'Personal matter (sample).'),
  leave(11, 'Vacation Leave', '2026-12-21', '2026-12-24', 'draft', '2026-09-27T17:00:00', '2026-09-27T17:00:00', 'Year-end holiday (sample).'),
  leave(12, 'Emergency Leave', '2026-04-14', '2026-04-15', 'approved', '2026-04-14T06:40:00', '2026-04-14T15:25:00', 'Urgent family matter (sample).'),
]

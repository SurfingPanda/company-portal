import { buildTimelineFor, departmentForCategory } from '@/lib/requests'
import type { EmployeeRequest, RequestAttachment, RequestCategory, RequestStatus, SubmittedAnswer } from '@/types/request'

/**
 * SAMPLE SUBMITTED REQUESTS (development only).
 * They belong to the mock current employee and are not stored on any server.
 * Replaced by `GET /api/requests` (the authenticated employee's requests) later.
 */

function mock(
  n: number,
  requestTypeId: string,
  requestTypeTitle: string,
  category: RequestCategory,
  title: string,
  status: RequestStatus,
  submittedAt: string,
  updatedAt: string,
  description: string,
  answers: [label: string, value: string][],
  attachments: RequestAttachment[] = [],
): EmployeeRequest {
  const reference = `REQ-2026-${String(n).padStart(4, '0')}`
  const department = departmentForCategory(category)
  return {
    id: reference,
    reference,
    requestTypeId,
    requestTypeTitle,
    category,
    title,
    description,
    status,
    submittedAt,
    updatedAt,
    answers: answers.map(([label, value], i): SubmittedAnswer => ({ fieldId: `f${i}`, label, value })),
    attachments,
    timeline: buildTimelineFor(category, status, submittedAt, updatedAt, department),
    assignedDepartment: department,
    currentStep: status === 'under-review' ? 'Under Review' : undefined,
    approvedAt: status === 'approved' ? updatedAt : undefined,
    rejectedAt: status === 'rejected' ? updatedAt : undefined,
    completedAt: status === 'completed' ? updatedAt : undefined,
    isSample: true,
  }
}

export const mockRequests: EmployeeRequest[] = [
  mock(1, 'rt-it-equipment', 'IT Equipment Request', 'it', 'Laptop for field work', 'under-review', '2026-10-01T09:15:00', '2026-10-01T11:40:00',
    'Sample request: replacement laptop.', [['Equipment type', 'Laptop'], ['Quantity', '1'], ['Justification', 'Sample justification text.']]),
  mock(3, 'rt-employee-update', 'Employee Information Update', 'hr', 'Update contact details', 'completed', '2026-09-22T10:00:00', '2026-09-25T16:20:00',
    'Sample request: update contact information.', [['What needs updating?', 'Contact details'], ['New information', 'Sample updated information']]),
  mock(4, 'rt-travel', 'Travel Request', 'hr', 'Branch visit travel', 'submitted', '2026-09-30T15:45:00', '2026-09-30T15:45:00',
    'Sample request: business travel.', [['Destination', 'Sample destination'], ['Departure date', 'October 20, 2026'], ['Return date', 'October 22, 2026'], ['Purpose of travel', 'Sample purpose.']]),
  mock(5, 'rt-office-supply', 'Office Supply Request', 'administration', 'Printer paper', 'rejected', '2026-09-18T13:10:00', '2026-09-21T09:50:00',
    'Sample request: office supplies.', [['Item', 'Printer paper'], ['Quantity', '5']]),
  mock(6, 'rt-system-access', 'System Access Request', 'it', 'Access to reporting system', 'cancelled', '2026-09-15T11:00:00', '2026-09-16T08:25:00',
    'Sample request: system access.', [['System name', 'Sample system'], ['Access level', 'View only'], ['Justification', 'Sample justification text.']],
    [{ id: 'att-1', name: 'access-justification.pdf', size: '85 KB' }]),
]

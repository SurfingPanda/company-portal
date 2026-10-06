import type { RequestCategory, RequestStatus } from '@/types/request'

/** Single set of category names for forms and requests. Will come from the API later. */
export const requestCategories: { id: RequestCategory; label: string; description: string; department: string }[] = [
  { id: 'hr', label: 'HR & Employee', description: 'Leave, employee information, travel and benefits.', department: 'HR Department' },
  { id: 'recruitment', label: 'Recruitment', description: 'Job applications, employee referrals and recruitment inquiries.', department: 'HR Department' },
  { id: 'it', label: 'IT & Systems', description: 'Equipment, system access, accounts and software.', department: 'MIS Department' },
  { id: 'administration', label: 'Administration', description: 'Office supplies, facilities, vehicles and general requests.', department: 'Administration Department' },
  { id: 'other', label: 'Other', description: 'Other company-specific requests.', department: 'Administration Department' },
]

export const getRequestCategory = (id: string) => requestCategories.find((c) => c.id === id)
export const getRequestCategoryLabel = (id: string) => getRequestCategory(id)?.label ?? id

export const requestStatusLabels: Record<RequestStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  'under-review': 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

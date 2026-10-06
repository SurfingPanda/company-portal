import { leaveTypes } from '@/data/leaveRequests'
import type { EmployeeRequestType, RequestCategory, RequestField } from '@/types/request'

/**
 * SAMPLE REQUEST TYPES (development only).
 *
 * These are examples, not confirmed company processes. Processing times, approval needs and the
 * fields below are placeholders. Replaced by `GET /api/request-types` once the Laravel backend exists;
 * because each type carries its own `fields`, the backend can add types without frontend changes.
 */

export const SAMPLE_INSTRUCTIONS = [
  'Review the details below and complete the required information.',
  'Provide accurate and complete information so the request can be processed.',
  'These instructions are sample text. The responsible department will confirm the official process.',
]

const text = (id: string, label: string, extra: Partial<RequestField> = {}): RequestField => ({ id, label, type: 'text', ...extra })
const area = (id: string, label: string, extra: Partial<RequestField> = {}): RequestField => ({ id, label, type: 'textarea', ...extra })
const select = (id: string, label: string, options: string[], extra: Partial<RequestField> = {}): RequestField => ({ id, label, type: 'select', options, ...extra })
const date = (id: string, label: string, extra: Partial<RequestField> = {}): RequestField => ({ id, label, type: 'date', ...extra })
const time = (id: string, label: string, extra: Partial<RequestField> = {}): RequestField => ({ id, label, type: 'time', ...extra })
const num = (id: string, label: string, extra: Partial<RequestField> = {}): RequestField => ({ id, label, type: 'number', ...extra })

interface Seed {
  id: string
  title: string
  description: string
  category: RequestCategory
  fields: RequestField[]
  tags?: string[]
  status?: 'available' | 'coming-soon'
  requiresAttachment?: boolean
  requiresApproval?: boolean
  isFeatured?: boolean
  referencePrefix?: string
  route?: string
}

const seeds: Seed[] = [
  // HR & Employee
  {
    id: 'rt-leave', title: 'Leave Request', category: 'hr', isFeatured: true, requiresApproval: true, referencePrefix: 'LV', route: '/hr/leave/request',
    description: 'Request time off for a given period. Balances and official leave records are handled by HR.', tags: ['leave', 'time-off', 'vacation'],
    fields: [
      select('leave-type', 'Leave type', leaveTypes.map((t) => t.name), { required: true, helpText: 'Sample leave types, not official ELJIN leave categories.' }),
      date('start-date', 'Date from', { required: true }),
      date('end-date', 'Date to', { required: true, notBeforeField: 'start-date' }),
      area('reason', 'Reason', { required: true, placeholder: 'A short reason is enough. Please do not include medical details.' }),
      text('contact-number', 'Contact number during leave', { placeholder: 'Optional' }),
      { id: 'contact-email', label: 'Email during leave', type: 'email', placeholder: 'Optional' },
    ],
  },
  {
    id: 'rt-employee-update', title: 'Employee Information Update', category: 'hr', isFeatured: true,
    description: 'Ask HR to update the information on your employee record.', tags: ['employee', 'record', 'update'],
    fields: [
      select('info-type', 'What needs updating?', ['Contact details', 'Civil status', 'Dependents', 'Other'], { required: true }),
      text('new-value', 'New information', { required: true, placeholder: 'Enter the updated information' }),
      date('effective-date', 'Effective date'),
    ],
  },
  {
    id: 'rt-contact-update', title: 'Contact Information Update', category: 'hr',
    description: 'Ask HR to update your contact details on the official employee record.', tags: ['contact', 'employee', 'update', 'information'],
    fields: [
      select('contact-field', 'What needs updating?', ['Mobile number', 'Address', 'Emergency contact', 'Other'], { required: true }),
      text('new-value', 'New information', { required: true, placeholder: 'Enter the updated information' }),
      area('reason', 'Reason / supporting information', { required: true, helpText: 'If a supporting document is needed, see the Employee Data Update Form in Forms.' }),
    ],
  },
  {
    id: 'rt-info-correction', title: 'Employee Information Correction', category: 'hr', requiresApproval: true,
    description: 'Report incorrect employment information shown in the portal.', tags: ['employee', 'correction', 'information', 'record'],
    fields: [
      select('info-field', 'Which information is incorrect?', ['Name', 'Job title', 'Department', 'Location', 'Manager', 'Date joined', 'Other'], { required: true }),
      text('current-value', 'Current (incorrect) value', { required: true }),
      text('correct-value', 'Correct value', { required: true }),
      area('reason', 'Reason / supporting information', { required: true }),
    ],
  },
  {
    id: 'rt-records-inquiry', title: 'Employment Record Inquiry', category: 'hr',
    description: 'Ask HR a question about your employment record.', tags: ['employment', 'record', 'inquiry', 'information'],
    fields: [text('subject', 'Subject', { required: true }), area('question', 'Your question', { required: true })],
  },
  {
    id: 'rt-other-info', title: 'Other HR Information Request', category: 'hr',
    description: 'Submit another employee information request that does not fit the types above.', tags: ['employee', 'information', 'other'],
    fields: [text('subject', 'Subject', { required: true }), area('details', 'Details', { required: true })],
  },
  {
    id: 'rt-employment-certificate', title: 'Employment Certificate Request', category: 'hr', requiresApproval: true,
    description: 'Request a certificate of employment.', tags: ['certificate', 'employment'],
    fields: [
      text('purpose', 'Purpose', { required: true, placeholder: 'e.g. bank requirement' }),
      date('needed-by', 'Needed by'),
    ],
  },
  {
    id: 'rt-travel', title: 'Travel Request', category: 'hr', requiresApproval: true,
    description: 'Request approval for business travel.', tags: ['travel', 'trip'],
    fields: [
      text('destination', 'Destination', { required: true }),
      date('departure', 'Departure date', { required: true }),
      date('return', 'Return date', { required: true, notBeforeField: 'departure' }),
      area('purpose', 'Purpose of travel', { required: true }),
      num('budget', 'Estimated budget (PHP)', { min: 0, helpText: 'Optional estimate.' }),
    ],
  },
  {
    id: 'rt-benefits', title: 'Benefits Inquiry', category: 'hr',
    description: 'Ask HR a question about employee benefits.', tags: ['benefits', 'inquiry'],
    fields: [select('topic', 'Topic', ['General', 'Coverage', 'Claims', 'Other'], { required: true }), area('question', 'Your question', { required: true })],
  },

  {
    id: 'rt-benefits-info', title: 'Benefits Information Request', category: 'hr',
    description: 'Ask HR for information about a benefit.', tags: ['benefits', 'information', 'request'],
    fields: [select('topic', 'Topic', ['Health & Wellness', 'Insurance', 'Government Benefits', 'Employee Assistance', 'Leave & Time Off', 'Other'], { required: true }), area('details', 'Details', { required: true })],
  },
  {
    id: 'rt-benefits-assistance', title: 'Benefits Assistance Request', category: 'hr',
    description: 'Ask HR for help with a benefits-related matter.', tags: ['benefits', 'assistance', 'help'],
    fields: [
      text('subject', 'Subject', { required: true }),
      area('details', 'Description', { required: true, helpText: 'Please do not include medical details or policy numbers.' }),
      select('contact-method', 'Preferred contact method', ['Email', 'Phone', 'No preference'], { required: true }),
    ],
  },
  {
    id: 'rt-other-benefits', title: 'Other Benefits Request', category: 'hr',
    description: 'Submit a benefits request that does not fit another type.', tags: ['benefits', 'other'],
    fields: [text('subject', 'Subject', { required: true }), area('details', 'Details', { required: true })],
  },
  {
    id: 'rt-hr-inquiry', title: 'HR Inquiry', category: 'hr',
    description: 'Ask HR a general question.', tags: ['hr', 'inquiry', 'question'],
    fields: [select('topic', 'Topic', ['Employment', 'Policies', 'Records', 'Other'], { required: true }), area('question', 'Your question', { required: true })],
  },
  {
    id: 'rt-benefits-request', title: 'Benefits Request', category: 'hr', requiresApproval: true,
    description: 'Submit a request related to employee benefits.', tags: ['benefits', 'request'],
    fields: [select('benefit-area', 'Benefit area', ['Health & Medical', 'Insurance', 'Government Benefits', 'Employee Assistance', 'Other'], { required: true }), area('details', 'Details', { required: true })],
  },
  {
    id: 'rt-hr-document', title: 'HR Document Request', category: 'hr',
    description: 'Ask HR for a copy of an HR document.', tags: ['hr', 'document', 'records'],
    fields: [text('document-name', 'Document needed', { required: true }), text('purpose', 'Purpose', { required: true }), date('needed-by', 'Needed by')],
  },
  {
    id: 'rt-employment-verification', title: 'Employment Verification Request', category: 'hr', requiresApproval: true,
    description: 'Ask HR to verify your employment to a third party.', tags: ['employment', 'verification'],
    fields: [text('requesting-party', 'Requesting party', { required: true, placeholder: 'Organisation that needs the verification' }), text('purpose', 'Purpose', { required: true })],
  },
  {
    id: 'rt-other-hr', title: 'Other HR Request', category: 'hr',
    description: 'Submit an HR request that does not fit another type.', tags: ['hr', 'other'],
    fields: [text('subject', 'Subject', { required: true }), area('details', 'Details', { required: true })],
  },
  // Recruitment
  {
    id: 'rt-job-application', title: 'Job Application', category: 'recruitment', route: '/recruitment/jobs',
    description: 'Apply for an open position. Choose a position from the job openings to start.', tags: ['recruitment', 'job', 'application'],
    fields: [],
  },
  {
    id: 'rt-employee-referral', title: 'Employee Referral', category: 'recruitment', route: '/recruitment/jobs',
    description: 'Refer a candidate for an open position. Choose a position from the job openings to start.', tags: ['recruitment', 'referral', 'candidate'],
    fields: [],
  },
  {
    id: 'rt-recruitment-inquiry', title: 'Recruitment Inquiry', category: 'recruitment',
    description: 'Ask HR a question about recruitment or job openings.', tags: ['recruitment', 'inquiry', 'question'],
    fields: [select('topic', 'Topic', ['Job openings', 'Application process', 'Referrals', 'Other'], { required: true }), area('question', 'Your question', { required: true })],
  },

  // IT & Systems
  {
    id: 'rt-it-equipment', title: 'IT Equipment Request', category: 'it', isFeatured: true, requiresApproval: true,
    description: 'Request a laptop, monitor, or other approved IT equipment.', tags: ['equipment', 'laptop', 'monitor', 'it'],
    fields: [
      select('equipment-type', 'Equipment type', ['Laptop', 'Desktop computer', 'Monitor', 'Keyboard / mouse', 'Other'], { required: true }),
      num('quantity', 'Quantity', { required: true, min: 1 }),
      area('justification', 'Justification', { required: true, placeholder: 'Why is this equipment needed?' }),
      date('needed-by', 'Needed by'),
    ],
  },
  {
    id: 'rt-system-access', title: 'System Access Request', category: 'it', isFeatured: true, requiresApproval: true,
    description: 'Request access to a company system or application.', tags: ['access', 'system', 'it'],
    fields: [
      text('system-name', 'System name', { required: true }),
      select('access-level', 'Access level', ['View only', 'Standard user', 'Other'], { required: true }),
      area('justification', 'Justification', { required: true }),
    ],
  },
  {
    id: 'rt-new-account', title: 'New Account Request', category: 'it', requiresApproval: true,
    description: 'Request a new user account.', tags: ['account', 'user', 'it'],
    fields: [
      select('account-type', 'Account type', ['Email', 'Network', 'Application'], { required: true }),
      area('details', 'Details', { required: true, placeholder: 'Describe the account you need.' }),
    ],
  },
  {
    id: 'rt-software', title: 'Software Installation Request', category: 'it', status: 'coming-soon', requiresApproval: true,
    description: 'Request installation of approved software.', tags: ['software', 'install', 'it'],
    fields: [
      text('software-name', 'Software name', { required: true }),
      text('version', 'Version'),
      { id: 'supervisor-ok', label: 'My supervisor has approved this request', type: 'checkbox', required: true },
    ],
  },
  {
    id: 'rt-device', title: 'Printer/Device Request', category: 'it',
    description: 'Request setup or a change for a printer or device.', tags: ['printer', 'device', 'it'],
    fields: [
      select('device', 'Device', ['Printer', 'Scanner', 'Other'], { required: true }),
      text('location', 'Location', { required: true, placeholder: 'e.g. floor or room' }),
      area('details', 'Request details', { required: true }),
    ],
  },
  {
    id: 'rt-tech-support', title: 'Technical Support Request', category: 'it', isFeatured: true, requiresAttachment: false,
    description: 'Report a technical problem to the IT team.', tags: ['support', 'issue', 'troubleshooting', 'it'],
    fields: [
      select('issue-category', 'Issue category', ['Computer', 'Network', 'Email', 'Application', 'Other'], { required: true }),
      area('issue', 'What is happening?', { required: true }),
      time('contact-time', 'Preferred contact time', { helpText: 'Optional.' }),
    ],
  },

  // Administration
  {
    id: 'rt-office-supply', title: 'Office Supply Request', category: 'administration',
    description: 'Request office supplies.', tags: ['supplies', 'office'],
    fields: [text('item', 'Item', { required: true }), num('quantity', 'Quantity', { required: true, min: 1 }), area('notes', 'Notes')],
  },
  {
    id: 'rt-facility', title: 'Facility Request', category: 'administration',
    description: 'Request use of a meeting room or other facility.', tags: ['facility', 'room', 'booking'],
    fields: [
      select('facility', 'Facility', ['Meeting room', 'Training room', 'Other'], { required: true }),
      date('use-date', 'Date', { required: true }),
      time('start-time', 'Start time', { required: true }),
      time('end-time', 'End time', { required: true }),
      area('purpose', 'Purpose', { required: true }),
    ],
  },
  {
    id: 'rt-vehicle', title: 'Vehicle Request', category: 'administration', status: 'coming-soon', requiresApproval: true,
    description: 'Request a company vehicle for official use.', tags: ['vehicle', 'transport'],
    fields: [text('destination', 'Destination', { required: true }), date('use-date', 'Date', { required: true }), area('purpose', 'Purpose', { required: true })],
  },
  {
    id: 'rt-general-admin', title: 'General Administrative Request', category: 'administration',
    description: 'Submit an administrative request not listed elsewhere.', tags: ['administrative', 'general'],
    fields: [text('subject', 'Subject', { required: true }), area('details', 'Details', { required: true })],
  },

  // Other
  {
    id: 'rt-other', title: 'General Request', category: 'other', requiresAttachment: false,
    description: 'Submit a request that does not fit another category.', tags: ['general', 'other'],
    fields: [text('subject', 'Subject', { required: true }), area('details', 'Details', { required: true })],
  },
]

export const requestTypes: EmployeeRequestType[] = seeds.map((seed) => ({
  id: seed.id,
  title: seed.title,
  description: seed.description,
  category: seed.category,
  estimatedProcessingTime: 'To be confirmed',
  requiresAttachment: seed.requiresAttachment ?? false,
  requiresApproval: seed.requiresApproval ?? false,
  status: seed.status ?? 'available',
  isFeatured: seed.isFeatured,
  tags: seed.tags ?? [],
  instructions: SAMPLE_INSTRUCTIONS,
  fields: seed.fields,
  referencePrefix: seed.referencePrefix,
  route: seed.route,
  isSample: true,
}))

/** Request types that change or query HR-managed employee information (Phase 16). They submit through the same request system. */
export const EMPLOYEE_INFORMATION_REQUEST_IDS = ['rt-employee-update', 'rt-contact-update', 'rt-info-correction', 'rt-records-inquiry', 'rt-other-info']

const BENEFITS_REQUEST_IDS = ['rt-benefits', 'rt-benefits-info', 'rt-benefits-assistance', 'rt-benefits-request', 'rt-other-benefits']

/**
 * Notification and activity wording for request types with their own copy. Other request types use the generic wording.
 * Both go through the existing notification and activity systems.
 */
export function getSubmissionCopy(requestTypeId: string): { title: string; message: string; activity: string } | undefined {
  if (EMPLOYEE_INFORMATION_REQUEST_IDS.includes(requestTypeId)) {
    return { title: 'Employee information request submitted', message: 'Your request has been submitted successfully.', activity: 'Submitted an employee information request' }
  }
  if (BENEFITS_REQUEST_IDS.includes(requestTypeId)) {
    return {
      title: 'Benefits request submitted',
      message: 'Your benefits-related request has been submitted successfully.',
      activity: requestTypeId === 'rt-benefits-assistance' ? 'Submitted a benefits assistance request' : 'Submitted a benefits request',
    }
  }
  return undefined
}

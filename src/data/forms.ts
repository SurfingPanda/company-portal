import { SAMPLE_INSTRUCTIONS } from '@/data/requestTypes'
import type { EmployeeForm, FormCategory } from '@/types/form'

/**
 * SAMPLE FORMS (development only).
 *
 * Forms are not official Eljin documents. Downloadable forms point at a record in the Documents
 * module through `documentId`, so file metadata (type, size, version) is never duplicated here.
 * Forms without a `documentId` have no file yet. Replaced by `GET /api/forms` later.
 */

interface Seed {
  id: string
  title: string
  description: string
  category: FormCategory
  type?: 'download' | 'online'
  documentId?: string
  requestTypeId?: string
  fileType?: string
  tags?: string[]
  isFeatured?: boolean
}

const seeds: Seed[] = [
  // HR & Employee
  { id: 'form-leave', title: 'Leave Request Form', category: 'hr', documentId: 'doc-008', description: 'Form for requesting leave.', tags: ['leave', 'time-off'], isFeatured: true },
  { id: 'form-overtime', title: 'Overtime Request Form', category: 'hr', documentId: 'doc-009', description: 'Form for requesting overtime work.', tags: ['overtime'], isFeatured: true },
  { id: 'form-data-update', title: 'Employee Data Update Form', category: 'hr', documentId: 'doc-010', description: 'Form for updating employee information.', tags: ['employee', 'update'], isFeatured: true },
  { id: 'form-travel', title: 'Travel Request Form', category: 'hr', documentId: 'doc-012', description: 'Form for requesting business travel.', tags: ['travel'], isFeatured: true },
  { id: 'form-employment-certificate', title: 'Employment Certificate Request Form', category: 'hr', type: 'online', requestTypeId: 'rt-employment-certificate', description: 'Form for requesting a certificate of employment.', tags: ['certificate', 'employment'] },
  { id: 'form-benefits', title: 'Benefits Enrollment Form', category: 'hr', description: 'Form for enrolling in employee benefits.', tags: ['benefits', 'enrollment'] },
  { id: 'form-clearance', title: 'Clearance Form', category: 'hr', description: 'Form for employee clearance.', tags: ['clearance'] },
  { id: 'form-leave-online', title: 'Leave Request (Online)', category: 'hr', type: 'online', requestTypeId: 'rt-leave', description: 'Submit a leave request through the portal.', tags: ['leave', 'online'] },
  { id: 'form-info-online', title: 'Employee Information Update (Online)', category: 'hr', type: 'online', requestTypeId: 'rt-employee-update', description: 'Submit an information update through the portal.', tags: ['employee', 'online'] },
  { id: 'form-benefits-info', title: 'Benefits Information Request Form', category: 'hr', type: 'online', requestTypeId: 'rt-benefits-info', description: 'Ask HR for information about a benefit.', tags: ['benefits', 'information'] },
  { id: 'form-benefits-assistance', title: 'Benefits Assistance Request Form', category: 'hr', type: 'online', requestTypeId: 'rt-benefits-assistance', description: 'Ask HR for help with a benefits-related matter.', tags: ['benefits', 'assistance'] },
  { id: 'form-other-benefits', title: 'Other Benefits Request Form', category: 'hr', type: 'online', requestTypeId: 'rt-other-benefits', description: 'Submit a benefits request that does not fit another form.', tags: ['benefits', 'other'] },
  { id: 'form-hr-inquiry', title: 'HR Inquiry Form', category: 'hr', type: 'online', requestTypeId: 'rt-hr-inquiry', description: 'Ask HR a general question through the portal.', tags: ['hr', 'inquiry'] },
  { id: 'form-benefits-request', title: 'Benefits Request Form', category: 'hr', type: 'online', requestTypeId: 'rt-benefits-request', description: 'Submit a benefits-related request through the portal.', tags: ['benefits', 'request'] },
  { id: 'form-hr-document', title: 'Employee Records Request Form', category: 'hr', type: 'online', requestTypeId: 'rt-hr-document', description: 'Ask HR for a copy of an HR document or record.', tags: ['records', 'document', 'hr'] },
  { id: 'form-other-hr', title: 'Other HR Request Form', category: 'hr', type: 'online', requestTypeId: 'rt-other-hr', description: 'Submit an HR request that does not fit another form.', tags: ['hr', 'other'] },

  // IT & Systems
  { id: 'form-it-equipment', title: 'IT Equipment Request Form', category: 'it', documentId: 'doc-011', description: 'Form for requesting IT equipment.', tags: ['equipment', 'it'], isFeatured: true },
  { id: 'form-system-access', title: 'System Access Request Form', category: 'it', description: 'Form for requesting system access.', tags: ['access', 'system'] },
  { id: 'form-software', title: 'Software Installation Request Form', category: 'it', description: 'Form for requesting software installation.', tags: ['software'] },

  // Administration
  { id: 'form-purchase', title: 'Purchase Request Form', category: 'administration', documentId: 'doc-013', description: 'Form for requesting purchases.', tags: ['purchase'] },
  { id: 'form-reimbursement', title: 'Reimbursement Request Form', category: 'administration', documentId: 'doc-014', description: 'Form for requesting expense reimbursement.', tags: ['reimbursement', 'expenses'] },
  { id: 'form-office-supply', title: 'Office Supply Request Form', category: 'administration', description: 'Form for requesting office supplies.', tags: ['supplies'] },
  { id: 'form-facility', title: 'Facility Use Request Form', category: 'administration', description: 'Form for requesting use of a facility.', tags: ['facility'] },
  { id: 'form-vehicle', title: 'Vehicle Request Form', category: 'administration', description: 'Form for requesting a company vehicle.', tags: ['vehicle'] },

  // Other
  { id: 'form-general', title: 'General Request Form', category: 'other', description: 'Form for requests that do not fit another category.', tags: ['general'] },
]

export const forms: EmployeeForm[] = seeds.map((seed) => ({
  id: seed.id,
  title: seed.title,
  description: seed.description,
  category: seed.category,
  type: seed.type ?? 'download',
  fileType: seed.fileType,
  documentId: seed.documentId,
  requestTypeId: seed.requestTypeId,
  isFeatured: seed.isFeatured,
  tags: seed.tags ?? [],
  instructions: SAMPLE_INSTRUCTIONS,
  isSample: true,
}))

import type { DocumentAccessLevel, DocumentCategory, DocumentFileType, DocumentResource } from '@/types/document'

/**
 * SAMPLE DOCUMENT RECORDS (development only).
 *
 * None of these are real Eljin Corporation documents, policies or forms, and no actual files exist.
 * Titles and descriptions are generic placeholders so the UI can be built and tested.
 * Replaced by `GET /api/documents` once the Laravel backend and file storage exist.
 */

interface Seed {
  title: string
  category: DocumentCategory
  department: string
  fileType: DocumentFileType
  /** [createdAt, updatedAt] */
  dates: [string, string]
  description: string
  tags: string[]
  version?: string
  fileSize?: string
  accessLevel?: DocumentAccessLevel
  isFeatured?: boolean
  isFrequentlyUsed?: boolean
}

const seeds: Seed[] = [
  // Policies & Guidelines
  { title: 'Attendance Policy', category: 'policies', department: 'Human Resources', fileType: 'PDF', dates: ['2026-02-10', '2026-08-14'], description: 'Sample record for the attendance policy document.', tags: ['attendance', 'timekeeping'], version: '1.0', fileSize: '240 KB' },
  { title: 'Workplace Conduct Guidelines', category: 'policies', department: 'Human Resources', fileType: 'PDF', dates: ['2026-02-10', '2026-07-22'], description: 'Sample record for workplace conduct guidelines.', tags: ['conduct', 'workplace'], version: '1.1', fileSize: '310 KB' },
  { title: 'Leave Policy', category: 'policies', department: 'Human Resources', fileType: 'PDF', dates: ['2026-02-12', '2026-06-03'], description: 'Sample record for the leave policy document.', tags: ['leave', 'benefits'], version: '1.0', fileSize: '198 KB' },
  { title: 'Information Security Guidelines', category: 'policies', department: 'MIS', fileType: 'PDF', dates: ['2026-03-05', '2026-09-02'], description: 'Sample record for information security guidelines.', tags: ['security', 'it'], version: '2.0', fileSize: '420 KB' },
  { title: 'Acceptable Use Policy', category: 'policies', department: 'MIS', fileType: 'PDF', dates: ['2026-03-05', '2026-05-19'], description: 'Sample record for the acceptable use of company systems.', tags: ['security', 'systems'], version: '1.2', fileSize: '175 KB' },
  { title: 'Travel and Expense Guidelines', category: 'policies', department: 'Finance', fileType: 'PDF', dates: ['2026-04-01', '2026-08-30'], description: 'Sample record for travel and expense guidelines.', tags: ['travel', 'expenses'], version: '1.0', fileSize: '260 KB' },
  { title: 'Safety and Emergency Guidelines', category: 'policies', department: 'Administration', fileType: 'PDF', dates: ['2026-01-20', '2026-09-15'], description: 'Sample record for safety and emergency guidelines.', tags: ['safety', 'emergency'], version: '1.3', fileSize: '530 KB', accessLevel: 'all' },

  // Forms
  { title: 'Leave Request Form', category: 'forms', department: 'Human Resources', fileType: 'DOCX', dates: ['2026-01-15', '2026-09-10'], description: 'Sample form record for requesting leave.', tags: ['leave', 'request'], version: '2.1', fileSize: '48 KB', isFrequentlyUsed: true },
  { title: 'Overtime Request Form', category: 'forms', department: 'Human Resources', fileType: 'DOCX', dates: ['2026-01-15', '2026-08-02'], description: 'Sample form record for requesting overtime.', tags: ['overtime', 'request'], version: '1.4', fileSize: '45 KB', isFrequentlyUsed: true },
  { title: 'Employee Data Update Form', category: 'forms', department: 'Human Resources', fileType: 'PDF', dates: ['2026-01-18', '2026-07-08'], description: 'Sample form record for updating employee information.', tags: ['employee', 'update'], version: '1.2', fileSize: '90 KB', isFrequentlyUsed: true },
  { title: 'IT Equipment Request Form', category: 'forms', department: 'MIS', fileType: 'DOCX', dates: ['2026-02-02', '2026-09-20'], description: 'Sample form record for requesting IT equipment.', tags: ['equipment', 'request', 'it'], version: '1.5', fileSize: '52 KB', isFrequentlyUsed: true },
  { title: 'Travel Request Form', category: 'forms', department: 'Administration', fileType: 'DOCX', dates: ['2026-02-02', '2026-06-25'], description: 'Sample form record for requesting business travel.', tags: ['travel', 'request'], version: '1.1', fileSize: '50 KB', isFrequentlyUsed: true },
  { title: 'Purchase Request Form', category: 'forms', department: 'Operations', fileType: 'XLSX', dates: ['2026-03-12', '2026-08-18'], description: 'Sample form record for requesting purchases.', tags: ['purchase', 'request'], version: '1.0', fileSize: '36 KB' },
  { title: 'Reimbursement Request Form', category: 'forms', department: 'Finance', fileType: 'XLSX', dates: ['2026-03-12', '2026-05-30'], description: 'Sample form record for expense reimbursement.', tags: ['reimbursement', 'finance'], version: '1.0', fileSize: '34 KB' },

  // Templates
  { title: 'Memorandum Template', category: 'templates', department: 'Administration', fileType: 'DOCX', dates: ['2026-02-20', '2026-04-11'], description: 'Sample template record for internal memoranda.', tags: ['memo', 'template'], version: '1.0', fileSize: '28 KB' },
  { title: 'Business Letter Template', category: 'templates', department: 'Administration', fileType: 'DOCX', dates: ['2026-02-20', '2026-04-11'], description: 'Sample template record for business correspondence.', tags: ['letter', 'template'], version: '1.0', fileSize: '30 KB' },
  { title: 'Meeting Minutes Template', category: 'templates', department: 'Administration', fileType: 'DOCX', dates: ['2026-03-01', '2026-07-14'], description: 'Sample template record for recording meeting minutes.', tags: ['meeting', 'template'], version: '1.1', fileSize: '26 KB' },
  { title: 'Presentation Template', category: 'templates', department: 'Marketing', fileType: 'PPTX', dates: ['2026-03-18', '2026-09-05'], description: 'Sample template record for company presentations.', tags: ['presentation', 'template'], version: '2.0', fileSize: '1.4 MB' },
  { title: 'Expense Report Template', category: 'templates', department: 'Finance', fileType: 'XLSX', dates: ['2026-04-09', '2026-08-26'], description: 'Sample template record for expense reporting.', tags: ['expenses', 'report'], version: '1.2', fileSize: '41 KB' },
  { title: 'Sales Report Template', category: 'templates', department: 'Sales', fileType: 'XLSX', dates: ['2026-04-22', '2026-06-17'], description: 'Sample template record for periodic sales reports.', tags: ['sales', 'report'], version: '1.0', fileSize: '55 KB' },

  // Manuals
  { title: 'Inventory System User Manual', category: 'manuals', department: 'Operations', fileType: 'PDF', dates: ['2026-02-25', '2026-08-08'], description: 'Sample record for an inventory system user manual.', tags: ['inventory', 'system', 'manual'], version: '3.0', fileSize: '2.8 MB' },
  { title: 'Helpdesk Ticketing User Guide', category: 'manuals', department: 'MIS', fileType: 'PDF', dates: ['2026-03-30', '2026-09-12'], description: 'Sample record for a helpdesk ticketing user guide.', tags: ['helpdesk', 'tickets', 'it'], version: '1.4', fileSize: '1.1 MB' },
  { title: 'Warehouse Operations Guide', category: 'manuals', department: 'Operations', fileType: 'PDF', dates: ['2026-01-27', '2026-05-06'], description: 'Sample record for a warehouse operations guide.', tags: ['warehouse', 'operations'], version: '2.2', fileSize: '3.4 MB', accessLevel: 'department' },
  { title: 'Intranet Portal User Guide', category: 'manuals', department: 'MIS', fileType: 'PDF', dates: ['2026-09-01', '2026-09-24'], description: 'Sample record for a guide to using the employee portal.', tags: ['portal', 'guide'], version: '1.0', fileSize: '860 KB', isFeatured: true },

  // HR Resources
  { title: 'Employee Handbook', category: 'hr', department: 'Human Resources', fileType: 'PDF', dates: ['2026-01-05', '2026-09-28'], description: 'Sample record for the employee handbook.', tags: ['handbook', 'employee', 'policies'], version: '1.2', fileSize: '4.2 MB', isFeatured: true, isFrequentlyUsed: true },
  { title: 'New Employee Orientation Guide', category: 'hr', department: 'Human Resources', fileType: 'PDF', dates: ['2026-01-05', '2026-08-20'], description: 'Sample record for a new employee orientation guide.', tags: ['orientation', 'onboarding'], version: '1.1', fileSize: '1.9 MB', isFeatured: true },
  { title: 'Employee Benefits Overview', category: 'hr', department: 'Human Resources', fileType: 'PDF', dates: ['2026-02-14', '2026-06-29'], description: 'Sample record for an employee benefits overview.', tags: ['benefits', 'employee'], version: '1.0', fileSize: '720 KB' },
  { title: 'Performance Review Guide', category: 'hr', department: 'Human Resources', fileType: 'PPTX', dates: ['2026-05-04', '2026-07-31'], description: 'Sample record for a performance review guide.', tags: ['performance', 'review'], version: '1.0', fileSize: '2.1 MB', accessLevel: 'manager' },

  // IT Resources
  { title: 'Email Setup Guide', category: 'it', department: 'MIS', fileType: 'PDF', dates: ['2026-02-03', '2026-09-18'], description: 'Sample record for a guide to setting up company email.', tags: ['email', 'setup'], version: '1.3', fileSize: '640 KB' },
  { title: 'Password Reset Guide', category: 'it', department: 'MIS', fileType: 'PDF', dates: ['2026-02-03', '2026-09-18'], description: 'Sample record for a guide to resetting an account password.', tags: ['password', 'account'], version: '1.2', fileSize: '420 KB' },
  { title: 'Printer Setup Guide', category: 'it', department: 'MIS', fileType: 'PDF', dates: ['2026-02-03', '2026-04-27'], description: 'Sample record for a guide to setting up office printers.', tags: ['printer', 'setup'], version: '1.0', fileSize: '510 KB' },
  { title: 'Remote Access Guide', category: 'it', department: 'MIS', fileType: 'PDF', dates: ['2026-04-14', '2026-08-11'], description: 'Sample record for a guide to remote access.', tags: ['remote', 'vpn'], version: '1.1', fileSize: '690 KB' },
  { title: 'Software Request Guide', category: 'it', department: 'MIS', fileType: 'DOCX', dates: ['2026-05-20', '2026-06-12'], description: 'Sample record for a guide to requesting software.', tags: ['software', 'request'], version: '1.0', fileSize: '88 KB' },

  // Company Resources
  { title: 'Brand Usage Guidelines', category: 'company', department: 'Marketing', fileType: 'PDF', dates: ['2026-03-09', '2026-07-03'], description: 'Sample record for brand usage guidelines.', tags: ['brand', 'logo'], version: '1.0', fileSize: '5.6 MB' },
  { title: 'Company Holiday Calendar', category: 'company', department: 'Administration', fileType: 'XLSX', dates: ['2026-01-08', '2026-01-08'], description: 'Sample record for a yearly holiday calendar.', tags: ['holidays', 'calendar'], version: '1.0', fileSize: '24 KB' },
  { title: 'Meeting Room Booking Guide', category: 'company', department: 'Administration', fileType: 'PDF', dates: ['2026-04-05', '2026-09-09'], description: 'Sample record for a guide to booking meeting rooms.', tags: ['meeting', 'rooms'], version: '1.0', fileSize: '380 KB' },
  { title: 'Office Directory Quick Reference', category: 'company', department: 'Administration', fileType: 'PDF', dates: ['2026-05-11', '2026-08-25'], description: 'Sample record for an office quick reference sheet.', tags: ['office', 'reference'], version: '1.1', fileSize: '300 KB' },

  // Recruitment Resources (appended so existing document ids do not shift)
  { title: 'Recruitment Guide', category: 'recruitment', department: 'Human Resources', fileType: 'PDF', dates: ['2026-06-01', '2026-09-10'], description: 'Sample record for a recruitment guide.', tags: ['recruitment', 'careers', 'guide'], version: '1.0', fileSize: '640 KB' },
  { title: 'Applicant Instructions', category: 'recruitment', department: 'Human Resources', fileType: 'PDF', dates: ['2026-06-01', '2026-08-18'], description: 'Sample record for applicant instructions.', tags: ['recruitment', 'application', 'instructions'], version: '1.0', fileSize: '210 KB' },
  { title: 'Employee Referral Guide', category: 'recruitment', department: 'Human Resources', fileType: 'PDF', dates: ['2026-06-15', '2026-09-02'], description: 'Sample record for an employee referral guide.', tags: ['recruitment', 'referral', 'guide'], version: '1.0', fileSize: '300 KB' },
  { title: 'Recruitment FAQ', category: 'recruitment', department: 'Human Resources', fileType: 'DOCX', dates: ['2026-07-01', '2026-09-20'], description: 'Sample record for recruitment frequently asked questions.', tags: ['recruitment', 'faq'], version: '1.0', fileSize: '95 KB' },
]

export const documents: DocumentResource[] = seeds.map((seed, index) => ({
  id: `doc-${String(index + 1).padStart(3, '0')}`,
  title: seed.title,
  description: seed.description,
  category: seed.category,
  department: seed.department,
  fileType: seed.fileType,
  fileSize: seed.fileSize,
  version: seed.version,
  owner: `${seed.department} Department`,
  createdAt: seed.dates[0],
  updatedAt: seed.dates[1],
  tags: seed.tags,
  accessLevel: seed.accessLevel ?? 'all',
  isFeatured: seed.isFeatured,
  isFrequentlyUsed: seed.isFrequentlyUsed,
  status: 'published',
  isSample: true,
}))

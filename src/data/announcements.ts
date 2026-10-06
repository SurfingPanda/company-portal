import type { Announcement, AnnouncementBlock, AnnouncementCategory, AnnouncementPriority, AnnouncementStatus } from '@/types/announcement'

/**
 * SAMPLE ANNOUNCEMENTS (development only).
 *
 * Every announcement here is fictional. None is a real Eljin Corporation announcement, policy,
 * holiday, office closure, benefit, salary matter or management decision. The text is deliberately
 * neutral so it can be replaced by real content from `GET /api/announcements` later.
 * Related ids point at records that already exist in the Documents, Calendar, Services and Forms modules.
 */

interface Seed {
  title: string
  summary: string
  category: AnnouncementCategory
  department?: string
  author?: string
  /** Local Philippine date-time; the +08:00 offset is added below. */
  publishedAt: string
  priority?: AnnouncementPriority
  status?: AnnouncementStatus
  pinned?: boolean
  audience?: 'all' | 'department'
  tags?: string[]
  points?: string[]
  documentId?: string
  eventId?: string
  serviceId?: string
  formId?: string
  attachment?: boolean
  read?: boolean
  updated?: string
}

const intro = (summary: string) => summary
const sampleNote = 'This is a sample announcement used for development. It is not an official Eljin Corporation announcement.'

const seeds: Seed[] = [
  { title: 'Scheduled Network Maintenance', summary: 'Network services in selected offices will undergo scheduled maintenance this evening.', category: 'it', department: 'MIS', author: 'MIS Department', publishedAt: '2026-09-30T08:30:00', priority: 'important', pinned: true, tags: ['maintenance', 'network'], points: ['Some internal services may be briefly unavailable.', 'Save your work before the maintenance window begins.', 'Contact the IT helpdesk if a service does not recover afterwards.'], serviceId: 'it-helpdesk', read: false },
  { title: 'Updated Employee Handbook', summary: 'The updated employee handbook is now available in the company document repository.', category: 'hr', department: 'Human Resources', author: 'Human Resources', publishedAt: '2026-09-28T09:00:00', tags: ['handbook'], points: ['Review the new version in Documents & Resources.', 'Ask your supervisor or HR if you have questions.'], documentId: 'doc-025', updated: '2026-09-29T10:15:00', read: false },
  { title: 'October Company Activities', summary: 'View the schedule of company activities and employee events for October.', category: 'company-news', department: 'Marketing', author: 'Corporate Communications', publishedAt: '2026-09-26T10:00:00', tags: ['events', 'calendar'], points: ['Activities are listed in the Company Calendar.', 'Event details may be updated as dates are confirmed.'], eventId: 'evt-018', read: false },
  { title: 'Updated Office Operations Schedule', summary: 'A sample notice about a change to the office operations schedule.', category: 'operations', department: 'Administration', author: 'Administration Department', publishedAt: '2026-09-30T09:00:00', priority: 'important', pinned: true, tags: ['schedule', 'operations'], points: ['Check your department for details that apply to you.', 'Questions can be sent to the Administration Department.'], read: false },
  { title: 'Internal Systems Unavailable This Evening', summary: 'Sample urgent notice: selected internal systems are unavailable while a fix is applied.', category: 'it', department: 'MIS', author: 'MIS Department', publishedAt: '2026-09-30T16:45:00', priority: 'urgent', tags: ['outage', 'systems'], points: ['Affected systems are listed by the MIS Department.', 'Updates will be posted here as they are available.'], serviceId: 'it-helpdesk', read: false },
  { title: 'Employee Training Registration', summary: 'Registration for upcoming employee training sessions is now open.', category: 'training', department: 'Human Resources', author: 'Human Resources', publishedAt: '2026-09-29T13:00:00', tags: ['training', 'registration'], points: ['See the Company Calendar for session dates.', 'Confirm attendance with your supervisor.'], eventId: 'evt-013', read: false },
  { title: 'Updated Office Safety Reminder', summary: 'A reminder of general office safety practices and the upcoming safety drill.', category: 'safety', department: 'Administration', author: 'Administration Department', publishedAt: '2026-09-27T11:30:00', priority: 'important', tags: ['safety', 'drill'], points: ['Know the nearest exits to your workstation.', 'Take part in the scheduled drill.', 'Report hazards to the Administration Department.'], documentId: 'doc-007', eventId: 'evt-020', read: true },
  { title: 'Department Meeting Schedule', summary: 'Monthly department meetings are scheduled for the coming weeks.', category: 'operations', department: 'Operations', author: 'Operations Department', publishedAt: '2026-09-26T14:00:00', audience: 'department', tags: ['meetings'], points: ['Meeting times are shown in the Company Calendar.', 'Prepare updates for your team.'], eventId: 'evt-008', read: true },
  { title: 'Document Repository Maintenance', summary: 'The document repository may be briefly unavailable during routine maintenance.', category: 'it', department: 'MIS', author: 'MIS Department', publishedAt: '2026-09-25T15:00:00', tags: ['documents', 'maintenance'], points: ['Download any files you need beforehand.', 'Access will return once maintenance is complete.'], serviceId: 'documents', read: true },
  { title: 'Payroll Processing Reminder', summary: 'A sample reminder about the upcoming payroll processing deadline.', category: 'finance', department: 'Finance', author: 'Finance Department', publishedAt: '2026-09-24T08:00:00', tags: ['payroll', 'deadline'], points: ['Submit required records before the deadline.', 'Contact the Finance Department with questions.'], eventId: 'evt-016', read: true },
  { title: 'Leave Forms Submission Reminder', summary: 'Employees are reminded to submit leave forms through the portal or the leave form.', category: 'hr', department: 'Human Resources', author: 'Human Resources', publishedAt: '2026-09-24T09:30:00', tags: ['leave', 'forms'], points: ['Use the Leave Request Form or the online leave request.', 'Check the deadline in the Company Calendar.'], formId: 'form-leave', eventId: 'evt-009', read: true },
  { title: 'New Intranet Portal User Guide', summary: 'A user guide for the employee portal has been added to Documents & Resources.', category: 'it', department: 'MIS', author: 'MIS Department', publishedAt: '2026-09-23T10:00:00', tags: ['portal', 'guide'], points: ['The guide explains the main sections of the portal.'], documentId: 'doc-024', attachment: true, read: true },
  { title: 'Employee Wellness Week', summary: 'Wellness activities are planned for a week in October. Details are in the calendar.', category: 'hr', department: 'Human Resources', author: 'Human Resources', publishedAt: '2026-09-22T09:00:00', tags: ['wellness', 'activities'], points: ['Participation is voluntary.', 'Activity schedules will be shared by Human Resources.'], eventId: 'evt-018', read: true },
  { title: 'Brand Usage Guidelines Available', summary: 'Brand usage guidelines are available for staff preparing company materials.', category: 'company-news', department: 'Marketing', author: 'Marketing Department', publishedAt: '2026-09-20T10:30:00', tags: ['brand', 'logo'], points: ['Use the guidelines when preparing presentations and documents.'], documentId: 'doc-034', read: true },
  { title: 'Quarterly Budget Submission Reminder', summary: 'Departments are reminded about the upcoming budget submission date.', category: 'finance', department: 'Finance', author: 'Finance Department', publishedAt: '2026-09-19T08:30:00', audience: 'department', tags: ['budget'], points: ['Department heads should confirm their submissions.'], eventId: 'evt-025', read: true },
  { title: 'Facilities Maintenance Notice', summary: 'Routine facilities maintenance may cause short interruptions in some areas.', category: 'facilities', department: 'Administration', author: 'Administration Department', publishedAt: '2026-09-17T13:00:00', tags: ['facilities'], points: ['Affected areas will be announced by the Administration Department.'], read: true },
  { title: 'Meeting Room Booking Guide', summary: 'A short guide to booking meeting rooms has been published.', category: 'facilities', department: 'Administration', author: 'Administration Department', publishedAt: '2026-09-15T09:00:00', tags: ['rooms', 'booking'], points: ['Follow the booking steps in the guide.'], documentId: 'doc-036', read: true },
  { title: 'System Access Request Process', summary: 'Employees can request access to company systems through the portal.', category: 'it', department: 'MIS', author: 'MIS Department', publishedAt: '2026-09-12T11:00:00', tags: ['access', 'requests'], points: ['Choose the System Access Request in Forms & Requests.', 'Describe the access you need and why.'], formId: 'rt-system-access', read: true },
  { title: 'Policy Documents Review Notice', summary: 'A sample notice reminding staff to review policy documents in the repository.', category: 'policy', department: 'Administration', author: 'Administration Department', publishedAt: '2026-09-10T10:00:00', tags: ['policy', 'review'], points: ['Policy documents are in Documents & Resources.'], documentId: 'doc-001', read: true },
  { title: 'Training Calendar Published', summary: 'The training calendar for the coming months is available.', category: 'training', department: 'Human Resources', author: 'Human Resources', publishedAt: '2026-09-05T09:00:00', tags: ['training'], points: ['Sessions are listed in the Company Calendar.'], eventId: 'evt-026', read: true },
  { title: 'Safety Orientation Schedule', summary: 'Safety orientation sessions are scheduled for newly assigned staff.', category: 'safety', department: 'Human Resources', author: 'Human Resources', publishedAt: '2026-09-03T08:30:00', tags: ['safety', 'orientation'], points: ['New staff should attend a session.'], eventId: 'evt-013', read: true },
  { title: 'Warehouse Procedures Reminder', summary: 'A sample reminder to follow standard procedures when working in warehouse areas.', category: 'operations', department: 'Operations', author: 'Operations Department', publishedAt: '2026-08-28T13:30:00', audience: 'department', tags: ['warehouse'], points: ['Refer to the Warehouse Operations Guide.'], documentId: 'doc-023', read: true },
  { title: 'Employee Directory Update Reminder', summary: 'Please check that your details in the employee directory are current.', category: 'hr', department: 'Human Resources', author: 'Human Resources', publishedAt: '2026-08-25T09:00:00', tags: ['directory'], points: ['Use the Employee Directory to review your listing.'], serviceId: 'directory', read: true },
  { title: 'General Office Notice', summary: 'A general sample notice for all employees.', category: 'other', department: 'Administration', author: 'Administration Department', publishedAt: '2026-08-15T10:00:00', tags: ['general'], read: true },
  { title: 'Previous Quarter Operations Notice', summary: 'An archived sample notice about operations.', category: 'operations', department: 'Operations', author: 'Operations Department', publishedAt: '2026-08-10T09:00:00', status: 'archived', tags: ['archive'], read: true },
  { title: 'Annual Leave Planning', summary: 'An archived sample notice about leave planning.', category: 'hr', department: 'Human Resources', author: 'Human Resources', publishedAt: '2026-07-20T09:00:00', status: 'archived', tags: ['archive', 'leave'], read: true },
  { title: 'Upcoming Briefing (Draft)', summary: 'A draft that employees should never see.', category: 'other', department: 'Administration', author: 'Administration Department', publishedAt: '2026-10-05T09:00:00', status: 'draft', tags: ['draft'] },
]

function buildContent(seed: Seed): AnnouncementBlock[] {
  const blocks: AnnouncementBlock[] = [{ type: 'paragraph', text: intro(seed.summary) }]
  if (seed.points?.length) {
    blocks.push({ type: 'heading', text: 'What you need to know' }, { type: 'list', items: seed.points })
  }
  blocks.push({ type: 'paragraph', text: sampleNote })
  return blocks
}

export const announcements: Announcement[] = seeds.map((seed, index) => ({
  id: `ann-${String(index + 1).padStart(3, '0')}`,
  title: seed.title,
  summary: seed.summary,
  content: buildContent(seed),
  category: seed.category,
  department: seed.department,
  author: seed.author,
  publishedAt: `${seed.publishedAt}+08:00`,
  updatedAt: seed.updated ? `${seed.updated}+08:00` : undefined,
  priority: seed.priority ?? 'normal',
  status: seed.status ?? 'published',
  isPinned: seed.pinned,
  audience: seed.audience ?? 'all',
  tags: seed.tags,
  relatedDocumentId: seed.documentId,
  relatedEventId: seed.eventId,
  relatedServiceId: seed.serviceId,
  relatedFormId: seed.formId,
  attachments: seed.attachment ? [{ id: `att-${index + 1}`, name: 'Sample attachment', fileType: 'PDF' }] : undefined,
  isRead: seed.read ?? false,
  isSample: true,
}))

import type { ResourceFAQ, ResourceFaqCategory } from '@/types/resource'

/**
 * SAMPLE DATA — NOT OFFICIAL ELJIN PROCEDURES.
 *
 * These FAQs are a navigation layer: each answer says where in the portal to look and links there. They make no
 * claims about company policy. Replaced by `GET /api/resources/faq` later.
 */

export const resourceFaqCategoryLabels: Record<ResourceFaqCategory, string> = {
  general: 'General',
  hr: 'HR',
  it: 'IT',
  documents: 'Documents & Forms',
  benefits: 'Benefits',
  recruitment: 'Recruitment',
  portal: 'Portal',
}

type Seed = Omit<ResourceFAQ, 'id'>

const seeds: Seed[] = [
  // General
  { category: 'general', question: 'Where can I find company information?', answer: 'Company information, history, leadership, departments and locations are under Company.', relatedRoute: '/company', tags: ['company', 'about'] },
  { category: 'general', question: 'Where are company announcements posted?', answer: 'Announcements are listed on the Announcements page, and the latest ones appear on Home.', relatedRoute: '/announcements', tags: ['news', 'announcements'] },
  { category: 'general', question: 'Where can I see the company calendar?', answer: 'Schedules, holidays and events are on the Company Calendar.', relatedRoute: '/calendar', tags: ['calendar', 'events', 'holidays'] },
  { category: 'general', question: 'How do I find a colleague?', answer: 'Use the Employee Directory to search by name, department or position. It shows business contact details only.', relatedRoute: '/directory', tags: ['directory', 'contact'] },
  // HR
  { category: 'hr', question: 'Where can I submit an employee request?', answer: 'Use Forms & Requests. Online requests get a reference number and can be tracked under My Requests.', relatedRoute: '/forms', tags: ['request', 'forms'] },
  { category: 'hr', question: 'How can I update my employee information?', answer: 'You can edit your preferred name, personal email and mobile number on your profile. Other information is maintained by HR, so submit an employee information request.', relatedRoute: '/profile', tags: ['profile', 'update', 'information'] },
  { category: 'hr', question: 'Where do I request time off?', answer: 'File a leave request through the portal. Leave balances and official records are handled by HR.', relatedRoute: '/hr/leave', tags: ['leave', 'time off'] },
  { category: 'hr', question: 'Where can I see the status of my requests?', answer: 'Open My Requests to see the status and timeline of requests you submitted.', relatedRoute: '/requests', tags: ['status', 'requests', 'track'] },
  // IT
  { category: 'it', question: 'Where can I submit an IT support request?', answer: 'Employees can submit IT support requests through the Employee Portal Helpdesk.', relatedRoute: '/helpdesk/new', tags: ['it', 'support', 'ticket'] },
  { category: 'it', question: 'Where can I find help articles for common IT problems?', answer: 'The IT Knowledge Base has sample guides for accounts, network, email, printers and more.', relatedRoute: '/helpdesk/knowledge-base', tags: ['it', 'guides', 'knowledge base'] },
  { category: 'it', question: 'How do I check on an IT ticket?', answer: 'Open My Tickets in the Helpdesk to see your tickets and their status.', relatedRoute: '/helpdesk/tickets', tags: ['ticket', 'status', 'it'] },
  { category: 'it', question: 'How do I request access to a system?', answer: 'Use the system access request from Forms & Requests, or ask through the Helpdesk.', relatedRoute: '/forms', tags: ['access', 'system', 'request'] },
  { category: 'it', question: 'How do I contact the IT team?', answer: 'Use the Contact MIS page. Specific contact details have not yet been configured for this portal.', relatedRoute: '/contact-mis', tags: ['contact', 'mis', 'it'] },
  // Documents & Forms
  { category: 'documents', question: 'Where can I find company policies?', answer: 'Policies and guidelines are kept in the Documents module.', relatedRoute: '/documents/policies', tags: ['policies', 'documents'] },
  { category: 'documents', question: 'Where can I download a form?', answer: 'Downloadable forms are listed in Forms & Requests. Each links to its record in Documents.', relatedRoute: '/forms', tags: ['forms', 'download'] },
  { category: 'documents', question: "What's the difference between a form and a request?", answer: 'A downloadable form is a document you fill in outside the portal. An online request is submitted in the portal and tracked under My Requests.', relatedRoute: '/forms', tags: ['forms', 'requests', 'difference'] },
  { category: 'documents', question: 'Where can I find templates and manuals?', answer: 'Templates and manuals are document categories in the Documents module.', relatedRoute: '/documents', tags: ['templates', 'manuals'] },
  // Benefits
  { category: 'benefits', question: 'Where can I view benefits information?', answer: 'The Benefits page lists benefit information entries. Official employee-specific information is available from HR or in HR-approved resources.', relatedRoute: '/benefits', tags: ['benefits', 'information'] },
  { category: 'benefits', question: 'How do I ask HR about a benefit?', answer: 'Submit a benefits inquiry or request from Forms & Requests.', relatedRoute: '/forms/rt-benefits', tags: ['benefits', 'inquiry'] },
  { category: 'benefits', question: 'Where are the benefits FAQs?', answer: 'The Benefits FAQ has questions about finding benefits information and submitting requests.', relatedRoute: '/benefits/faq', tags: ['benefits', 'faq'] },
  // Recruitment
  { category: 'recruitment', question: 'Where can I see job openings?', answer: 'Recruitment & Careers lists current openings. The openings shown are sample data until HR publishes real ones.', relatedRoute: '/recruitment/jobs', tags: ['jobs', 'openings', 'careers'] },
  { category: 'recruitment', question: 'How do I refer someone for a position?', answer: 'Open a position and choose Refer a Candidate, if referrals are enabled for it.', relatedRoute: '/recruitment/jobs', tags: ['referral', 'candidate'] },
  { category: 'recruitment', question: 'Where can I see my applications?', answer: 'My Applications lists applications submitted through the portal.', relatedRoute: '/recruitment/applications', tags: ['application', 'status'] },
  // Portal
  { category: 'portal', question: 'Where do I change my portal preferences?', answer: 'Portal preferences and account information are under Account Settings.', relatedRoute: '/account/settings', tags: ['settings', 'preferences'] },
  { category: 'portal', question: 'Where can I see my notifications?', answer: 'The bell in the top bar shows recent notifications; the Notifications page lists all of them.', relatedRoute: '/notifications', tags: ['notifications', 'alerts'] },
  { category: 'portal', question: 'Is the information in the portal official?', answer: 'Much of it is sample content while the portal is being built. Official records are maintained by HR.', relatedRoute: '/resources', tags: ['sample', 'official', 'data'] },
]

export const resourceFaqs: ResourceFAQ[] = seeds.map((seed, index) => ({ id: `rfaq-${String(index + 1).padStart(3, '0')}`, ...seed }))

import type { EmployeeResource, QuickAccessLink, ResourceCategory, ResourceLinkItem } from '@/types/resource'

/**
 * SAMPLE DATA — NOT OFFICIAL ELJIN CONTENT.
 *
 * The Resource Center is a discovery layer. This file holds only navigation metadata: category definitions, curated
 * page entries, and ids of items that already exist in other modules. Documents, forms, services, benefits,
 * announcements and help articles are NOT copied here; `resourceService` builds the searchable index from those
 * modules' own data. Replaced by `GET /api/resources`, `/api/resources/categories` and `/api/resources/featured` later.
 */

export const resourceCategories: ResourceCategory[] = [
  { id: 'hr', title: 'HR & Employee', description: 'HR services, leave, profile and recruitment.', href: '/resources/hr' },
  { id: 'it', title: 'IT & Systems', description: 'Helpdesk, IT guides and systems.', href: '/resources/it' },
  { id: 'company', title: 'Company', description: 'Company information, directory, news and calendar.', href: '/resources/company' },
  { id: 'policies', title: 'Policies & Guidelines', description: 'Policy and guideline documents.', href: '/documents/policies' },
  { id: 'forms', title: 'Forms & Requests', description: 'Downloadable forms and online requests.', href: '/forms' },
  { id: 'benefits', title: 'Benefits', description: 'Benefit information, FAQs and resources.', href: '/benefits' },
  { id: 'support', title: 'Help & Support', description: 'IT helpdesk and contact options.', href: '/helpdesk' },
  { id: 'faq', title: 'Frequently Asked Questions', description: 'Short answers that point to the right module.', href: '/resources/faq' },
]

export const quickAccessLinks: QuickAccessLink[] = [
  { id: 'qa-hr', label: 'HR Resources', description: 'Services, leave, profile', href: '/resources/hr', icon: 'hr' },
  { id: 'qa-it', label: 'IT Resources', description: 'Helpdesk and guides', href: '/resources/it', icon: 'it' },
  { id: 'qa-company', label: 'Company Resources', description: 'About, news, calendar', href: '/resources/company', icon: 'company' },
  { id: 'qa-policies', label: 'Policies & Guidelines', description: 'In Documents', href: '/documents/policies', icon: 'policies' },
  { id: 'qa-forms', label: 'Employee Forms', description: 'Forms and requests', href: '/forms', icon: 'forms' },
  { id: 'qa-benefits', label: 'Benefits', description: 'Information and FAQ', href: '/benefits', icon: 'benefits' },
  { id: 'qa-helpdesk', label: 'Helpdesk', description: 'IT support', href: '/helpdesk', icon: 'support' },
  { id: 'qa-faq', label: 'FAQ', description: 'Common questions', href: '/resources/faq', icon: 'faq' },
]

/** Curated page-level entries (destinations that are pages rather than records). */
export const curatedResources: EmployeeResource[] = [
  { id: 'res-forms', title: 'Employee Forms', description: 'Downloadable forms and online requests.', category: 'forms', type: 'page', route: '/forms', tags: ['forms', 'requests', 'download'] },
  { id: 'res-requests', title: 'My Requests', description: 'Track requests you submitted through the portal.', category: 'forms', type: 'page', route: '/requests', tags: ['requests', 'status', 'track'] },
  { id: 'res-hr', title: 'HR Services', description: 'HR services, forms, leave and benefits in one place.', category: 'hr', type: 'page', route: '/hr', tags: ['hr', 'services', 'employee'] },
  { id: 'res-hr-services', title: 'All HR Services', description: 'Browse and filter HR services.', category: 'hr', type: 'page', route: '/hr/services', tags: ['hr', 'services'] },
  { id: 'res-leave', title: 'Leave Requests', description: 'File and track leave requests. Balances are handled by HR.', category: 'hr', type: 'page', route: '/hr/leave', tags: ['leave', 'time off', 'vacation', 'guide'] },
  { id: 'res-profile', title: 'My Profile', description: 'Your employee information and contact details.', category: 'hr', type: 'page', route: '/profile', tags: ['profile', 'employee information', 'contact'] },
  { id: 'res-recruitment', title: 'Recruitment & Careers', description: 'Job openings, applications and referrals.', category: 'hr', type: 'page', route: '/recruitment', tags: ['jobs', 'careers', 'referral', 'recruitment'] },
  { id: 'res-benefits', title: 'Benefits & Employee Resources', description: 'Benefit information, FAQ, forms and resources.', category: 'benefits', type: 'page', route: '/benefits', tags: ['benefits', 'information'] },
  { id: 'res-benefits-faq', title: 'Benefits FAQ', description: 'Common questions about finding benefits information.', category: 'benefits', type: 'page', route: '/benefits/faq', tags: ['benefits', 'faq'] },
  { id: 'res-benefits-resources', title: 'Benefit Resources', description: 'Benefit documents, forms and HR services.', category: 'benefits', type: 'page', route: '/benefits/resources', tags: ['benefits', 'resources'] },
  { id: 'res-documents', title: 'Documents & Resources', description: 'Policies, forms, manuals and templates.', category: 'company', type: 'page', route: '/documents', tags: ['documents', 'files', 'library'] },
  { id: 'res-policies', title: 'Policies & Guidelines', description: 'Policy and guideline documents in the Documents module.', category: 'policies', type: 'page', route: '/documents/policies', tags: ['policies', 'workplace', 'guidelines'] },
  { id: 'res-directory', title: 'Employee Directory', description: 'Find colleagues and departments.', category: 'company', type: 'page', route: '/directory', tags: ['directory', 'colleagues', 'contacts'] },
  { id: 'res-company', title: 'Company Information', description: 'About the company.', category: 'company', type: 'page', route: '/company', tags: ['company', 'about'] },
  { id: 'res-history', title: 'Company History', description: 'Company history page.', category: 'company', type: 'page', route: '/company/history', tags: ['history'] },
  { id: 'res-leadership', title: 'Leadership', description: 'Company leadership page.', category: 'company', type: 'page', route: '/company/leadership', tags: ['leadership', 'management'] },
  { id: 'res-departments', title: 'Departments', description: 'Company departments.', category: 'company', type: 'page', route: '/company/departments', tags: ['departments'] },
  { id: 'res-organization', title: 'Organization Chart', description: 'Who reports to whom.', category: 'company', type: 'page', route: '/company/organization', tags: ['organization', 'org chart', 'structure', 'reporting'] },
  { id: 'res-locations', title: 'Locations', description: 'Company locations.', category: 'company', type: 'page', route: '/company/locations', tags: ['locations', 'offices'] },
  { id: 'res-announcements', title: 'Announcements', description: 'Company announcements.', category: 'company', type: 'page', route: '/announcements', tags: ['announcements', 'news'] },
  { id: 'res-calendar', title: 'Company Calendar', description: 'Schedules, holidays and events.', category: 'company', type: 'page', route: '/calendar', tags: ['calendar', 'events', 'holidays'] },
  { id: 'res-helpdesk', title: 'IT Helpdesk', description: 'Submit and track IT support requests.', category: 'support', type: 'page', route: '/helpdesk', tags: ['it', 'helpdesk', 'support', 'ticket'] },
  { id: 'res-helpdesk-new', title: 'Submit an IT Request', description: 'Report a technical problem to the IT team.', category: 'support', type: 'page', route: '/helpdesk/new', tags: ['it', 'ticket', 'request', 'support'] },
  { id: 'res-knowledge-base', title: 'IT Knowledge Base', description: 'Help articles for common IT problems.', category: 'it', type: 'page', route: '/helpdesk/knowledge-base', tags: ['it', 'help', 'articles', 'guides'] },
  { id: 'res-contact-mis', title: 'Contact MIS', description: 'How to reach the MIS / IT team.', category: 'support', type: 'page', route: '/contact-mis', tags: ['contact', 'mis', 'it', 'support'] },
  { id: 'res-faq', title: 'Employee FAQ', description: 'Common questions that point to the right module.', category: 'faq', type: 'page', route: '/resources/faq', tags: ['faq', 'questions', 'help'] },
]

/** Featured resources, in display order. Ids refer to curated entries or to derived ones ("document:…", "kb:…"). */
export const featuredResourceIds = ['document:doc-025', 'document:doc-026', 'document:doc-029', 'kb:kb-006', 'res-leave', 'document:doc-027', 'res-policies', 'res-forms']

/** Resources shown in the compact Home section, in order. */
export const homeResourceIds = ['res-forms', 'res-hr', 'res-benefits', 'res-helpdesk', 'res-documents', 'res-faq']

/** Link groups for the category pages. Every target is an existing module route. */
export const hrServiceLinks: ResourceLinkItem[] = [
  { label: 'HR & Employee Services', description: 'HR landing page', href: '/hr' },
  { label: 'All HR Services', href: '/hr/services' },
  { label: 'Leave Requests', href: '/hr/leave' },
  { label: 'Employee Forms', href: '/forms' },
  { label: 'Benefits', href: '/benefits' },
  { label: 'Recruitment & Careers', href: '/recruitment' },
  { label: 'My Profile', href: '/profile' },
]

export const hrDocumentLinks: ResourceLinkItem[] = [
  { label: 'Employee policies', href: '/documents/policies' },
  { label: 'HR forms', href: '/forms?category=hr' },
  { label: 'Employee guides', href: '/documents?category=hr' },
  { label: 'Benefits resources', href: '/benefits/resources' },
  { label: 'Recruitment resources', href: '/documents?category=recruitment' },
]

export const itServiceLinks: ResourceLinkItem[] = [
  { label: 'IT Helpdesk', href: '/helpdesk' },
  { label: 'Knowledge Base', href: '/helpdesk/knowledge-base' },
]

export const companyLinks: ResourceLinkItem[] = [
  { label: 'Company Information', href: '/company' },
  { label: 'Company History', href: '/company/history' },
  { label: 'Leadership', href: '/company/leadership' },
  { label: 'Departments', href: '/company/departments' },
  { label: 'Organization Chart', href: '/company/organization' },
  { label: 'Locations', href: '/company/locations' },
  { label: 'Announcements', href: '/announcements' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Documents', href: '/documents' },
]

export const benefitsLinks: ResourceLinkItem[] = [
  { label: 'Benefits overview', href: '/benefits' },
  { label: 'Benefits FAQ', href: '/benefits/faq' },
  { label: 'Benefits resources', href: '/benefits/resources' },
  { label: 'Benefits requests', href: '/forms/rt-benefits-request' },
]

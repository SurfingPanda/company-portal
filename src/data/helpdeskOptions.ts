import type { KnowledgeBaseCategory } from '@/types/knowledgeBase'
import type { SupportContact, TicketCategory, TicketPriority, TicketSort, TicketStatus, TicketType } from '@/types/helpdesk'

/** Generic IT ticket vocabulary. Will come from `GET /api/helpdesk/categories` later. */
export const ticketTypeOptions: { value: TicketType; label: string }[] = [
  { value: 'incident', label: 'Incident' },
  { value: 'service-request', label: 'Service Request' },
  { value: 'access-request', label: 'Access Request' },
  { value: 'question', label: 'Question' },
  { value: 'other', label: 'Other' },
]

export const ticketCategoryOptions: { value: TicketCategory; label: string }[] = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'network', label: 'Network' },
  { value: 'account', label: 'Account' },
  { value: 'email', label: 'Email' },
  { value: 'printer', label: 'Printer' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
]

export const ticketStatusLabels: Record<TicketStatus, string> = {
  new: 'New',
  open: 'Open',
  pending: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

export const ticketPriorityLabels: Record<TicketPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

export const ticketSortOptions: { value: TicketSort; label: string }[] = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
]

export const getTicketCategoryLabel = (value: string) => ticketCategoryOptions.find((c) => c.value === value)?.label ?? value
export const getTicketTypeLabel = (value: string) => ticketTypeOptions.find((t) => t.value === value)?.label ?? value

/** Location choices are generic. Real locations can come from the Company Locations module later. */
export const ticketLocationOptions = ['Office', 'Remote', 'Branch', 'Other']
export const deviceTypeOptions = ['Laptop', 'Desktop computer', 'Mobile phone', 'Tablet', 'Printer', 'Other']
export const operatingSystemOptions = ['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Other']

export const TICKET_PAGE_SIZE = 10

/** Allowed attachment types and size for the (frontend-only) attachment selector. */
export const ATTACHMENT_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt', 'log', 'doc', 'docx', 'xls', 'xlsx', 'csv']
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024

export const knowledgeBaseCategories: { id: KnowledgeBaseCategory; label: string }[] = [
  { id: 'accounts', label: 'Accounts' },
  { id: 'microsoft-365', label: 'Microsoft 365' },
  { id: 'network', label: 'Network' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'printers', label: 'Printers' },
  { id: 'security', label: 'Security' },
  { id: 'remote-work', label: 'Remote Work' },
  { id: 'general', label: 'General' },
]

export const getKnowledgeBaseCategoryLabel = (id: string) => knowledgeBaseCategories.find((c) => c.id === id)?.label ?? id

/** "Common Issues" shortcuts. Generic IT topics only; each opens the matching knowledge-base view. */
export const commonIssues: { label: string; href: string }[] = [
  { label: 'Account & Password', href: '/helpdesk/knowledge-base?category=accounts' },
  { label: 'Email & Microsoft 365', href: '/helpdesk/knowledge-base?category=microsoft-365' },
  { label: 'Network & Wi-Fi', href: '/helpdesk/knowledge-base?category=network' },
  { label: 'Computers & Laptops', href: '/helpdesk/knowledge-base?category=hardware' },
  { label: 'Printers', href: '/helpdesk/knowledge-base?category=printers' },
  { label: 'Software', href: '/helpdesk/knowledge-base?q=software' },
  { label: 'VPN & Remote Access', href: '/helpdesk/knowledge-base?category=remote-work' },
  { label: 'Mobile Devices', href: '/helpdesk/knowledge-base?q=mobile' },
  { label: 'Other', href: '/helpdesk/knowledge-base?category=general' },
]

/**
 * Support contact details. Intentionally unconfigured: no contact information is invented.
 * MIS will supply the real values (later from Laravel); until then the placeholder text shows.
 */
export const supportContact: SupportContact = {
  name: 'IT Helpdesk',
  supportHours: undefined,
  email: undefined,
  phone: undefined,
  officeLocation: undefined,
  placeholder: 'Contact information will be configured by MIS.',
}

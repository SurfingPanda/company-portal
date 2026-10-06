export type TicketType = 'incident' | 'service-request' | 'access-request' | 'question' | 'other'

export type TicketCategory = 'hardware' | 'software' | 'network' | 'account' | 'email' | 'printer' | 'security' | 'other'

/** Generic lifecycle: new -> open -> pending <-> open -> resolved -> closed (or cancelled). Not a workflow engine. */
export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed' | 'cancelled'

/** Informational only. The helpdesk system decides real prioritization, never the employee's selection. */
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface TicketAttachment {
  id: string
  name: string
  fileType: string
  /** Size in bytes, when known. */
  size?: number
}

export interface TicketActivity {
  id: string
  /** "event" entries are system/status changes; "reply" entries are messages. */
  kind: 'event' | 'reply'
  actor: 'employee' | 'support' | 'system'
  /** Display label such as "You" or "IT Support". Never a real person's name in sample data. */
  actorLabel: string
  message: string
  /** ISO date-time (local, no offset). */
  createdAt: string
  attachments?: TicketAttachment[]
}

/**
 * An IT helpdesk ticket. Shaped to stay flexible for an external ticketing system: `id` is the portal's key,
 * `reference` is the display number (INC-/REQ-), and neither assumes any vendor format.
 * Employees may only ever see their own tickets; the backend must enforce that, not React.
 */
export interface HelpdeskTicket {
  id: string
  reference: string
  subject: string
  description: string
  type: TicketType
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
  assignedTo?: string
  location?: string
  deviceType?: string
  operatingSystem?: string
  assetTag?: string
  requesterId: string
  attachments: TicketAttachment[]
  activity: TicketActivity[]
  isSample?: boolean
}

export type TicketSort = 'updated' | 'newest' | 'oldest'

/** Query parameters for a future `GET /api/helpdesk/tickets` request. */
export interface TicketQuery {
  search?: string
  status?: TicketStatus
  category?: TicketCategory
  priority?: TicketPriority
  sort?: TicketSort
  page?: number
  perPage?: number
}

/** What the new-ticket form sends to `POST /api/helpdesk/tickets`. */
export interface NewTicketPayload {
  type: TicketType
  category: TicketCategory
  subject: string
  description: string
  location?: string
  deviceType?: string
  operatingSystem?: string
  assetTag?: string
  attachment?: { name: string; size: number }
  /** The chosen file. Only the API adapter uploads it. */
  file?: File
}

/** Support contact details. Every field is configured by MIS; none are invented here. */
export interface SupportContact {
  name: string
  supportHours?: string
  email?: string
  phone?: string
  officeLocation?: string
  /** Shown for any field that has not been configured. */
  placeholder: string
}

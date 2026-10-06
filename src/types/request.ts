/** One category set shared by forms and request types, so the same area is never named two ways. */
export type RequestCategory = 'hr' | 'recruitment' | 'it' | 'administration' | 'other'

export type RequestFieldType = 'text' | 'textarea' | 'select' | 'date' | 'time' | 'number' | 'file' | 'checkbox' | 'email'

/**
 * One input in a dynamic request form. A future Laravel endpoint can return these definitions,
 * so new request types need no new frontend code.
 */
export interface RequestField {
  id: string
  label: string
  type: RequestFieldType
  required?: boolean
  placeholder?: string
  options?: string[]
  helpText?: string
  /** For numbers. */
  min?: number
  /** For dates: must be on or after the value of another date field (e.g. an end date after a start date). */
  notBeforeField?: string
}

export interface EmployeeRequestType {
  id: string
  title: string
  description: string
  category: RequestCategory
  estimatedProcessingTime?: string
  requiresAttachment?: boolean
  requiresApproval?: boolean
  status: 'available' | 'coming-soon'
  isFeatured?: boolean
  tags: string[]
  /** Short guidance shown on the request page. Sample text until real instructions exist. */
  instructions?: string[]
  /** Request-specific fields. Title and description are always collected in addition. */
  fields: RequestField[]
  /** Prefix of generated references (default "REQ"), e.g. "LV" gives LV-2026-0001. */
  referencePrefix?: string
  /** Dedicated portal page for this request type. When set, "Start Request" opens it instead of the generic form. */
  route?: string
  isSample?: boolean
}

export type RequestStatus = 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'completed' | 'cancelled'

export interface SubmittedAnswer {
  fieldId: string
  label: string
  value: string
}

export interface RequestAttachment {
  id: string
  name: string
  /** Human-readable size, e.g. "120 KB". */
  size?: string
}

export interface RequestTimelineEntry {
  id: string
  label: string
  /** "done" steps have happened, "current" is the step in progress, "pending" are still ahead. */
  state: 'done' | 'current' | 'pending'
  /** ISO date-time. */
  timestamp?: string
  description?: string
  /** Department or generic label, never an employee name. */
  actor?: string
}

/**
 * A submitted request. Shaped like a future Laravel `requests` resource, including the workflow
 * fields an approval module will fill in (no approval logic exists yet).
 */
export interface EmployeeRequest {
  id: string
  /** Display reference, e.g. REQ-2026-0001. */
  reference: string
  requestTypeId: string
  requestTypeTitle: string
  category: RequestCategory
  title: string
  description: string
  status: RequestStatus
  /** ISO date-time. */
  submittedAt: string
  /** ISO date-time. */
  updatedAt: string
  answers: SubmittedAnswer[]
  /** Raw submitted values keyed by field id (ISO dates, unformatted), so specialised views such as leave can read them back. */
  values?: Record<string, string>
  attachments: RequestAttachment[]
  timeline: RequestTimelineEntry[]
  currentStep?: string
  assignedDepartment?: string
  assignedUserId?: string
  approvedAt?: string
  rejectedAt?: string
  completedAt?: string
  /** True for development sample records. */
  isSample?: boolean
}

/** What the form sends to `POST /api/requests`. The employee is taken from the session once login exists. */
export interface NewRequestPayload {
  requestType: EmployeeRequestType
  title: string
  description: string
  values: Record<string, string>
  attachment?: { name: string; size: number }
  /** The chosen file itself. Only the API adapter uploads it; the mock adapter keeps just its name and size. */
  file?: File
}

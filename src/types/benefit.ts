export type BenefitCategoryId = 'health' | 'insurance' | 'government' | 'assistance' | 'leave' | 'programs' | 'other'

/** A generic category. Not a claim that ELJIN provides every category. */
export interface BenefitCategory {
  id: BenefitCategoryId
  label: string
  description: string
}

export type BenefitStatus = 'available' | 'information-only' | 'coming-soon'

/**
 * A benefit information entry (not an employee's benefit record, and never a balance, amount or eligibility result).
 * Shaped like a future `GET /api/benefits/{id}` resource. Related documents, forms and services are referenced by
 * id so their metadata stays in the Documents, Forms and HR Services modules.
 */
export interface EmployeeBenefit {
  id: string
  name: string
  shortDescription: string
  description: string
  category: BenefitCategoryId
  status: BenefitStatus
  isFeatured?: boolean
  /** HR-published eligibility text. Left empty until HR provides it; the page then says it has not been published. */
  eligibility?: string
  /** HR-published coverage or feature points. Left empty until HR provides them. */
  features?: string[]
  relatedDocumentIds?: string[]
  relatedFormIds?: string[]
  /** Ids of HR services (Phase 14). */
  relatedServiceIds?: string[]
  relatedFaqCategory?: string
  /** Request type (Phase 8) used for questions about this benefit. */
  requestTypeId?: string
  /** Address of an external benefits page or provider, if HR supplies one. Never invented. */
  externalUrl?: string
  /** Ids of existing announcements about this benefit, if any. */
  relatedAnnouncementIds?: string[]
  /** True for demonstration records. They are not official ELJIN benefits. */
  isSample?: boolean
}

export interface BenefitFAQ {
  id: string
  question: string
  answer: string
  category?: string
  relatedBenefitId?: string
  relatedDocumentId?: string
}

export interface BenefitQuery {
  search?: string
  category?: BenefitCategoryId
}

export interface BenefitFaqQuery {
  search?: string
  category?: string
}

export interface BenefitResourceLink {
  id: string
  label: string
  description: string
  /** Portal route. */
  href?: string
}

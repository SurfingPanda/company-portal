export type ResourceCategoryId = 'hr' | 'it' | 'company' | 'policies' | 'forms' | 'benefits' | 'support' | 'faq'

export type ResourceType = 'document' | 'form' | 'service' | 'page' | 'faq' | 'external'

/**
 * One entry in the Resource Center index. It holds metadata and a pointer (route or id) to the module that owns
 * the real content (Documents, Forms, Services, Benefits, Announcements, Helpdesk); it never copies that content.
 * Shaped like a future `GET /api/resources` item, including what an administrator would manage later
 * (title, description, category, tags, destination, featured flag, related items).
 */
export interface EmployeeResource {
  /** Curated entries use "res-…"; derived entries use "<type>:<source id>", e.g. "document:doc-025". */
  id: string
  title: string
  description: string
  category: ResourceCategoryId
  type: ResourceType
  /** Portal route to open. */
  route?: string
  documentId?: string
  formId?: string
  serviceId?: string
  benefitId?: string
  faqId?: string
  tags: string[]
  isFeatured?: boolean
  /** True when the target is a sample/demo record rather than confirmed company content. */
  isSample?: boolean
}

export interface ResourceCategory {
  id: ResourceCategoryId
  title: string
  description: string
  /** Existing module or Resource Center page this category opens. */
  href: string
}

export interface ResourceQuery {
  search?: string
  category?: ResourceCategoryId
  type?: ResourceType
}

export type ResourceFaqCategory = 'general' | 'hr' | 'it' | 'documents' | 'benefits' | 'recruitment' | 'portal'

/** A navigation/help answer. Not an official policy; it points to the module that handles the topic. */
export interface ResourceFAQ {
  id: string
  question: string
  answer: string
  category: ResourceFaqCategory
  relatedRoute?: string
  relatedResourceId?: string
  tags: string[]
}

export interface ResourceFaqQuery {
  search?: string
  category?: ResourceFaqCategory
}

export interface ResourceLinkItem {
  label: string
  description?: string
  href: string
}

export interface QuickAccessLink {
  id: string
  label: string
  description: string
  href: string
  icon: 'hr' | 'it' | 'company' | 'policies' | 'forms' | 'benefits' | 'support' | 'faq'
}

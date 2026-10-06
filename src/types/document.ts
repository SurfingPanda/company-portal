export type DocumentCategory = 'policies' | 'forms' | 'templates' | 'manuals' | 'hr' | 'recruitment' | 'it' | 'company'

export type DocumentFileType = 'PDF' | 'DOC' | 'DOCX' | 'XLS' | 'XLSX' | 'PPT' | 'PPTX'

/** Who may open a document. Only displayed for now; enforcement belongs to the backend phase. */
export type DocumentAccessLevel = 'all' | 'department' | 'manager' | 'restricted'

export type DocumentSort = 'updated' | 'added' | 'az' | 'za'

/**
 * A document record. Shaped to match a future Laravel `documents` resource, including the
 * fields an admin module will need (status, access level, featured flag, owner, version).
 */
export interface DocumentResource {
  id: string
  title: string
  description: string
  category: DocumentCategory
  department: string
  fileType: DocumentFileType
  fileSize?: string
  version?: string
  owner?: string
  /** ISO date (YYYY-MM-DD). */
  updatedAt: string
  /** ISO date (YYYY-MM-DD). */
  createdAt: string
  tags: string[]
  accessLevel: DocumentAccessLevel
  isFeatured?: boolean
  isFrequentlyUsed?: boolean
  /** Archived documents are hidden from employees. */
  status?: 'published' | 'archived'
  /** True for development sample records that are not real company documents. */
  isSample?: boolean
}

export interface DocumentCategoryInfo {
  id: DocumentCategory
  label: string
  description: string
  /** Dedicated page for the category, or a filtered landing page. */
  href: string
}

export interface DocumentCategorySummary extends DocumentCategoryInfo {
  count: number
}

/** Query parameters that map to a future `GET /api/documents` request. */
export interface DocumentQuery {
  search?: string
  category?: DocumentCategory
  department?: string
  fileType?: DocumentFileType
  sort?: DocumentSort
  page?: number
  perPage?: number
}

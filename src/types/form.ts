import type { EmployeeRequestType, RequestCategory } from '@/types/request'

export type FormCategory = RequestCategory

/** A form employees can open. "download" forms are documents; "online" forms start a portal request. */
export interface EmployeeForm {
  id: string
  title: string
  description: string
  category: FormCategory
  type: 'download' | 'online'
  fileType?: string
  /** Id of the matching record in the Documents module. Metadata lives there, not here. */
  documentId?: string
  /** Optional portal route. */
  route?: string
  /** For online forms: the request type that is started. */
  requestTypeId?: string
  isFeatured?: boolean
  tags: string[]
  /** Short guidance. Sample text until real instructions exist. */
  instructions?: string[]
  isSample?: boolean
}

/** Forms and request types share one catalog so they can be searched together while staying distinct. */
export type CatalogItem =
  | { kind: 'form'; form: EmployeeForm }
  | { kind: 'request'; requestType: EmployeeRequestType }

export interface CatalogQuery {
  search?: string
  kind?: 'form' | 'request'
  category?: RequestCategory
  status?: 'available' | 'coming-soon'
}

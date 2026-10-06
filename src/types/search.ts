export type SearchResultType = 'document' | 'form' | 'service' | 'benefit' | 'announcement' | 'event' | 'helpdesk' | 'job' | 'resource' | 'company' | 'faq' | 'directory'

/**
 * One searchable item. Results are built from the existing modules' own objects and always carry a route into the
 * module that owns the content; nothing is copied or stored separately. Shaped for a future `GET /api/search` response.
 */
export interface GlobalSearchResult {
  /** "<type>:<source id>", e.g. "document:doc-025". */
  id: string
  title: string
  description: string
  type: SearchResultType
  category?: string
  route?: string
  /** Id in the owning module. */
  relatedId?: string
  tags?: string[]
  /** ISO date or date-time, used for the "Newest" sort and shown on the result. */
  date?: string
  isFeatured?: boolean
  /** Extra searchable text that is not displayed (department, file type, announcement body, skills …). */
  keywords?: string[]
  /** True when the target is sample/demo content rather than confirmed company content. */
  isSample?: boolean
}

export type SearchSort = 'relevance' | 'newest' | 'az'

/** Parameters that map to a future `GET /api/search?q=&type=&sort=&page=&perPage=`. */
export interface SearchQuery {
  q: string
  type?: SearchResultType
  sort?: SearchSort
  page?: number
  perPage?: number
}

export interface SearchResponse {
  data: GlobalSearchResult[]
  total: number
  page: number
  perPage: number
  /** Matches per type, ignoring the type filter (for the filter labels). */
  counts: Partial<Record<SearchResultType, number>>
}

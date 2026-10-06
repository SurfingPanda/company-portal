import { api } from '@/services/api'
import type { GlobalSearchResult, SearchQuery, SearchResponse, SearchResultType } from '@/types/search'

/**
 * Global search, Laravel adapter: GET /api/search?q=&type=&page=. Plain database search over the portal entities the employee
 * may see (announcements, documents, forms, benefits, resources, events, jobs). The portal-only extras of the sample index
 * (directory, company pages, knowledge base, FAQs) are not part of this endpoint.
 * Without a type filter Laravel returns the top matches of each type; choosing a type pages through that type.
 */
interface ApiHit { type: string; id: number; title: string; summary: string | null; category: string | null; key?: string | null }
interface ApiSearch { data: ApiHit[]; meta: { counts?: Record<string, number>; total?: number; current_page?: number; per_page?: number } }

/** Backend plural entity names <-> the portal's result types. */
const TO_PORTAL: Record<string, SearchResultType> = { announcements: 'announcement', documents: 'document', forms: 'form', benefits: 'benefit', resources: 'resource', events: 'event', jobs: 'job', directory: 'directory' }
const TO_API = Object.fromEntries(Object.entries(TO_PORTAL).map(([api, portal]) => [portal, api]))
const ROUTES: Partial<Record<SearchResultType, (id: number) => string>> = {
  announcement: (id) => `/announcements/${id}`,
  document: (id) => `/documents/${id}`,
  form: (id) => `/forms/${id}`,
  benefit: (id) => `/benefits/${id}`,
  event: (id) => `/calendar/${id}`,
  job: (id) => `/recruitment/jobs/${id}`,
  resource: () => '/resources',
}

const toResult = (hit: ApiHit): GlobalSearchResult => {
  const type = TO_PORTAL[hit.type]
  // Directory entries are addressed by employee ID, everything else by its numeric id.
  const route = type === 'directory' && hit.key ? `/directory/${encodeURIComponent(hit.key)}` : ROUTES[type]?.(hit.id)
  return { id: `${type}:${hit.key ?? hit.id}`, title: hit.title, description: hit.summary ?? '', type, category: hit.category ?? undefined, route, relatedId: hit.key ?? String(hit.id) }
}

export async function search(query: SearchQuery): Promise<SearchResponse> {
  const perPage = query.perPage ?? 10
  const page = query.page ?? 1
  const typed = query.type ? TO_API[query.type] : undefined

  // Counts per type always come from the unfiltered call, so the filter labels stay accurate.
  const overview = await api.get<ApiSearch>('/api/search', { q: query.q })
  const counts: SearchResponse['counts'] = {}
  for (const [name, count] of Object.entries(overview.meta.counts ?? {})) counts[TO_PORTAL[name]] = count

  let hits: ApiHit[] = overview.data
  let total = overview.data.length
  if (typed) {
    const result = await api.get<ApiSearch>('/api/search', { q: query.q, type: typed, page, per_page: perPage })
    hits = result.data
    total = result.meta.total ?? hits.length
  }
  let data = hits.map(toResult)
  if (query.sort === 'az') data = [...data].sort((a, b) => a.title.localeCompare(b.title))
  if (!typed) data = data.slice((page - 1) * perPage, page * perPage)
  return { data, total, page, perPage, counts }
}

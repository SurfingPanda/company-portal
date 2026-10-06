import { resourceCategories } from '@/data/resources'
import { api } from '@/services/api'
import type { ApiPage } from '@/services/adapters/paginate'
import type { ApiResponse } from '@/types/api'
import type { EmployeeResource, ResourceCategory, ResourceCategoryId, ResourceFAQ, ResourceFaqCategory, ResourceFaqQuery, ResourceQuery, ResourceType } from '@/types/resource'

/**
 * Resource Center, Laravel adapter: GET /api/resources[/{id}|/featured|/categories|/faq]. A resource points at the module that
 * owns the content (document, form, benefit, service key or route); the content itself is never copied.
 */
interface ApiResource {
  id: number
  title: string
  description: string | null
  category: ResourceCategoryId
  resource_type: ResourceType
  target_url: string | null
  document_id: number | null
  form_id: number | null
  benefit_id: number | null
  service_key: string | null
  is_featured: boolean
  is_sample?: boolean
}

interface ApiResourceFaq { id: number; question: string; answer: string; category: ResourceFaqCategory; related_route: string | null }

const KNOWN = new Set<string>(resourceCategories.map((c) => c.id))
const str = (n: number | null) => (n === null ? undefined : String(n))

const toResource = (r: ApiResource): EmployeeResource => ({
  id: String(r.id),
  title: r.title,
  description: r.description ?? '',
  category: (KNOWN.has(r.category) ? r.category : 'company') as ResourceCategoryId,
  type: r.resource_type,
  route: r.target_url ?? undefined,
  documentId: str(r.document_id),
  formId: str(r.form_id),
  benefitId: str(r.benefit_id),
  serviceId: r.service_key ?? undefined,
  tags: [],
  isFeatured: r.is_featured,
  isSample: r.is_sample,
})

const toFaq = (f: ApiResourceFaq): ResourceFAQ => ({ id: String(f.id), question: f.question, answer: f.answer, category: f.category, relatedRoute: f.related_route ?? undefined, tags: [] })

export async function getResources(query: ResourceQuery = {}): Promise<EmployeeResource[]> {
  const page = await api.get<ApiPage<ApiResource>>('/api/resources', { search: query.search?.trim(), category: query.category, resource_type: query.type, per_page: 100 })
  return page.data.map(toResource)
}

export async function getResource(id: string): Promise<EmployeeResource | null> {
  try {
    return toResource((await api.get<ApiResponse<ApiResource>>(`/api/resources/${encodeURIComponent(id)}`)).data)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

export async function getResourcesByIds(ids: string[]): Promise<EmployeeResource[]> {
  const all = await getResources()
  return ids.map((id) => all.find((r) => r.id === id)).filter((r): r is EmployeeResource => Boolean(r))
}

export async function getFeaturedResources(): Promise<EmployeeResource[]> {
  return (await api.get<ApiResponse<ApiResource[]>>('/api/resources/featured')).data.map(toResource)
}

export async function getResourceCategories(): Promise<(ResourceCategory & { count: number })[]> {
  const all = await getResources()
  return resourceCategories.map((c) => ({ ...c, count: all.filter((r) => r.category === c.id).length }))
}

export async function getResourceFaqs(query: ResourceFaqQuery = {}): Promise<ResourceFAQ[]> {
  const page = await api.get<ApiPage<ApiResourceFaq>>('/api/resources/faq', { search: query.search?.trim(), category: query.category, per_page: 100 })
  return page.data.map(toFaq)
}

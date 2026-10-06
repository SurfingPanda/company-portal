import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/resources.api'
import { announcements } from '@/data/announcements'
import { benefits } from '@/data/benefits'
import { documentCategories } from '@/data/documentCategories'
import { documents } from '@/data/documents'
import { knowledgeBaseArticles } from '@/data/knowledgeBase'
import { curatedResources, featuredResourceIds, resourceCategories } from '@/data/resources'
import { resourceFaqCategoryLabels, resourceFaqs } from '@/data/resourceFaq'
import { getRequestCategoryLabel } from '@/data/requestCategories'
import { getCatalog } from '@/services/formService'
import type { DocumentCategory } from '@/types/document'
import type { EmployeeResource, ResourceCategory, ResourceCategoryId, ResourceFAQ, ResourceFaqQuery, ResourceQuery, ResourceType } from '@/types/resource'

/**
 * Service layer for the Employee Resource Center (a discovery layer; it owns no content).
 *
 *   getResources / getResource         GET /api/resources, /api/resources/{id}
 *   getFeaturedResources               GET /api/resources/featured
 *   getResourceCategories              GET /api/resources/categories
 *   getResourceFaqs                    GET /api/resources/faq
 *
 * The searchable index is built here from the modules that own the real content (Documents, Forms, Services,
 * Benefits, Announcements, Helpdesk) plus a few curated page entries. Nothing is duplicated into the Resource
 * Center's own data, so a change in a source module shows up here automatically. A future backend can return the
 * same shape from a single endpoint.
 */

const MOCK_LATENCY_MS = 150
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

export const resourceTypeLabels: Record<ResourceType, string> = {
  document: 'Document',
  form: 'Form / Request',
  service: 'Service',
  page: 'Page',
  faq: 'FAQ',
  external: 'External',
}

export const getResourceCategoryLabel = (id: string) => resourceCategories.find((c) => c.id === id)?.title ?? id

const documentCategoryMap: Record<DocumentCategory, ResourceCategoryId> = {
  policies: 'policies',
  forms: 'forms',
  templates: 'company',
  manuals: 'company',
  hr: 'hr',
  recruitment: 'hr',
  it: 'it',
  company: 'company',
}


const featured = new Set(featuredResourceIds)
const withFeatured = (r: EmployeeResource): EmployeeResource => (featured.has(r.id) ? { ...r, isFeatured: true } : r)

/** Builds the full index. Entries only carry metadata and a pointer to the owning module. */
async function buildIndex(): Promise<EmployeeResource[]> {
  const catalog = await getCatalog()

  const docs = documents
    .filter((d) => d.status !== 'archived' && d.accessLevel === 'all')
    .map((d): EmployeeResource => ({
      id: `document:${d.id}`, title: d.title, description: d.description, category: documentCategoryMap[d.category], type: 'document',
      route: `/documents/${d.id}`, documentId: d.id, tags: [...d.tags, d.department], isSample: d.isSample,
    }))

  const formItems = catalog.map((item): EmployeeResource => {
    const base = item.kind === 'form' ? item.form : item.requestType
    return {
      id: `form:${base.id}`, title: base.title, description: base.description, category: 'forms', type: 'form', route: `/forms/${base.id}`, formId: base.id,
      tags: [...base.tags, getRequestCategoryLabel(base.category)], isSample: base.isSample,
    }
  })

  const benefitItems = benefits.map((b): EmployeeResource => ({
    id: `benefit:${b.id}`, title: b.name, description: b.shortDescription, category: 'benefits', type: 'page', route: `/benefits/${b.id}`, benefitId: b.id, tags: ['benefits'], isSample: b.isSample,
  }))

  const articles = knowledgeBaseArticles.map((a): EmployeeResource => ({
    id: `kb:${a.id}`, title: a.title, description: a.summary, category: 'it', type: 'page', route: `/helpdesk/knowledge-base/${a.id}`, tags: [...a.tags, 'help article'], isSample: a.isSample,
  }))

  const news = announcements
    .filter((a) => a.status === 'published')
    .map((a): EmployeeResource => ({
      id: `announcement:${a.id}`, title: a.title, description: a.summary, category: 'company', type: 'page', route: `/announcements/${a.id}`, tags: [...(a.tags ?? []), 'announcement'], isSample: a.isSample,
    }))

  const faqItems = resourceFaqs.map((f): EmployeeResource => ({
    id: `faq:${f.id}`, title: f.question, description: f.answer, category: 'faq', type: 'faq', route: `/resources/faq?q=${encodeURIComponent(f.question)}`, faqId: f.id, tags: f.tags,
  }))

  return [...curatedResources, ...docs, ...formItems, ...benefitItems, ...articles, ...news, ...faqItems].map(withFeatured)
}

let indexPromise: Promise<EmployeeResource[]> | undefined
const getIndex = () => (indexPromise ??= buildIndex())

const matches = (resource: EmployeeResource, search: string) => {
  const haystack = [resource.title, resource.description, getResourceCategoryLabel(resource.category), resourceTypeLabels[resource.type], ...resource.tags].join(' ')
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.toLowerCase().includes(term))
}

/** GET /api/resources. Case-insensitive search over title, description, category, type and tags. */
async function mockGetResources(query: ResourceQuery = {}): Promise<EmployeeResource[]> {
  await wait()
  const index = await getIndex()
  const results = index
    .filter((r) => (query.category ? r.category === query.category : true))
    .filter((r) => (query.type ? r.type === query.type : true))
    .filter((r) => (query.search?.trim() ? matches(r, query.search) : true))
  // Title matches first, then the rest.
  const term = query.search?.trim().toLowerCase()
  return term ? results.sort((a, b) => Number(b.title.toLowerCase().includes(term)) - Number(a.title.toLowerCase().includes(term))) : results
}

/** GET /api/resources/{id} */
async function mockGetResource(id: string): Promise<EmployeeResource | null> {
  const index = await getIndex()
  return index.find((r) => r.id === id) ?? null
}

async function mockGetResourcesByIds(ids: string[]): Promise<EmployeeResource[]> {
  await wait()
  const index = await getIndex()
  return ids.map((id) => index.find((r) => r.id === id)).filter((r): r is EmployeeResource => Boolean(r))
}

/** GET /api/resources/featured (order follows `featuredResourceIds`). */
async function mockGetFeaturedResources(): Promise<EmployeeResource[]> {
  return getResourcesByIds(featuredResourceIds)
}

/** GET /api/resources/categories. Counts come from the index, never typed in by hand. */
async function mockGetResourceCategories(): Promise<(ResourceCategory & { count: number })[]> {
  await wait()
  const index = await getIndex()
  return resourceCategories.map((c) => ({ ...c, count: index.filter((r) => r.category === c.id).length }))
}

export const getDocumentCategoryLabel = (id: string) => documentCategories.find((c) => c.id === id)?.label ?? id

/** GET /api/resources/faq */
async function mockGetResourceFaqs(query: ResourceFaqQuery = {}): Promise<ResourceFAQ[]> {
  await wait()
  return resourceFaqs
    .filter((f) => (query.category ? f.category === query.category : true))
    .filter((f) => {
      if (!query.search?.trim()) return true
      const haystack = [f.question, f.answer, resourceFaqCategoryLabels[f.category], ...f.tags].join(' ').toLowerCase()
      return query.search.toLowerCase().split(/\s+/).filter(Boolean).every((t) => haystack.includes(t))
    })
}

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getResources: typeof mockGetResources = isApiMode ? apiAdapter.getResources : mockGetResources
export const getResource: typeof mockGetResource = isApiMode ? apiAdapter.getResource : mockGetResource
export const getResourcesByIds: typeof mockGetResourcesByIds = isApiMode ? apiAdapter.getResourcesByIds : mockGetResourcesByIds
export const getFeaturedResources: typeof mockGetFeaturedResources = isApiMode ? apiAdapter.getFeaturedResources : mockGetFeaturedResources
export const getResourceCategories: typeof mockGetResourceCategories = isApiMode ? apiAdapter.getResourceCategories : mockGetResourceCategories
export const getResourceFaqs: typeof mockGetResourceFaqs = isApiMode ? apiAdapter.getResourceFaqs : mockGetResourceFaqs

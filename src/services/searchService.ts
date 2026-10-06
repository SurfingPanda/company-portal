import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/search.api'
import { announcements } from '@/data/announcements'
import { benefitFaqs } from '@/data/benefitFaq'
import { benefits } from '@/data/benefits'
import { departments, locations } from '@/data/companyData'
import { documents } from '@/data/documents'
import { events } from '@/data/events'
import { getEventCategoryLabel } from '@/data/eventCategories'
import { jobs } from '@/data/jobs'
import { knowledgeBaseArticles } from '@/data/knowledgeBase'
import { mockEmployees } from '@/data/mockEmployees'
import { getRequestCategoryLabel } from '@/data/requestCategories'
import { resourceFaqs } from '@/data/resourceFaq'
import { curatedResources } from '@/data/resources'
import { getCategoryInfo } from '@/data/documentCategories'
import { getCatalog } from '@/services/formService'
import { getBenefitCategoryLabel } from '@/services/benefitService'
import { isJobAcceptingCandidates } from '@/lib/recruitment'
import { getResourceCategoryLabel } from '@/services/resourceService'
import { buildSearchIndex, searchIndex, type IndexedResult } from '@/utils/globalSearch'
import type { GlobalSearchResult, SearchQuery, SearchResponse } from '@/types/search'

/**
 * Global search service. Results are built from the existing modules' own data (nothing is duplicated) and the index
 * is created once. Replace `search` with `GET /api/search` later; the Laravel backend must enforce authorization.
 *
 * Deliberately NOT searchable: private requests, private IT tickets, applications, referrals, salary, payroll, personal
 * contact details, and anything HR-confidential. The directory exposes only name, position, department, location and
 * company email.
 */

const MOCK_LATENCY_MS = 120
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

const blocksToText = (blocks: { type: string; text?: string; items?: string[] }[]) => blocks.flatMap((b) => (b.type === 'list' ? (b.items ?? []) : [b.text ?? ''])).join(' ')

const companyPages: GlobalSearchResult[] = [
  { id: 'company:overview', title: 'Company Information', description: 'About the company: introduction, mission, vision and values.', type: 'company', category: 'Company', route: '/company', tags: ['about', 'company', 'mission', 'vision', 'values'] },
  { id: 'company:history', title: 'Company History', description: 'Company history and milestones.', type: 'company', category: 'Company', route: '/company/history', tags: ['history', 'milestones'] },
  { id: 'company:leadership', title: 'Leadership', description: 'Company leadership.', type: 'company', category: 'Company', route: '/company/leadership', tags: ['leadership', 'management'] },
  { id: 'company:departments', title: 'Departments', description: 'Company departments.', type: 'company', category: 'Company', route: '/company/departments', tags: ['departments', 'organization'] },
  { id: 'company:organization', title: 'Organization Chart', description: 'Who reports to whom.', type: 'company', category: 'Company', route: '/company/organization', tags: ['organization', 'org chart', 'structure', 'reporting'] },
  { id: 'company:locations', title: 'Locations', description: 'Company locations.', type: 'company', category: 'Company', route: '/company/locations', tags: ['locations', 'offices'] },
]

async function buildResults(): Promise<GlobalSearchResult[]> {
  const catalog = await getCatalog()

  const docs = documents
    .filter((d) => d.status !== 'archived' && d.accessLevel === 'all')
    .map((d): GlobalSearchResult => ({
      id: `document:${d.id}`, title: d.title, description: d.description, type: 'document', category: getCategoryInfo(d.category)?.label ?? d.category,
      route: `/documents/${d.id}`, relatedId: d.id, tags: d.tags, date: d.updatedAt, isFeatured: d.isFeatured, keywords: [d.department, d.fileType], isSample: d.isSample,
    }))

  const forms = catalog.map((item): GlobalSearchResult => {
    const base = item.kind === 'form' ? item.form : item.requestType
    return {
      id: `form:${base.id}`, title: base.title, description: base.description, type: 'form', category: getRequestCategoryLabel(base.category),
      route: `/forms/${base.id}`, relatedId: base.id, tags: base.tags, isFeatured: base.isFeatured, isSample: base.isSample,
    }
  })

  const benefitItems = benefits.map((b): GlobalSearchResult => ({
    id: `benefit:${b.id}`, title: b.name, description: b.shortDescription, type: 'benefit', category: getBenefitCategoryLabel(b.category),
    route: `/benefits/${b.id}`, relatedId: b.id, tags: ['benefits'], isFeatured: b.isFeatured, isSample: b.isSample,
  }))

  // Respect existing visibility: published only, not expired.
  const now = Date.now()
  const news = announcements
    .filter((a) => a.status === 'published' && (!a.expiresAt || new Date(a.expiresAt).getTime() > now))
    .map((a): GlobalSearchResult => ({
      id: `announcement:${a.id}`, title: a.title, description: a.summary, type: 'announcement', category: a.category.replace('-', ' '),
      route: `/announcements/${a.id}`, relatedId: a.id, tags: a.tags, date: a.publishedAt, isFeatured: a.isPinned, keywords: [blocksToText(a.content), a.department ?? ''], isSample: a.isSample,
    }))

  const eventItems = events
    .filter((e) => (e.visibility ?? 'all') === 'all')
    .map((e): GlobalSearchResult => ({
      id: `event:${e.id}`, title: e.title, description: e.description, type: 'event', category: getEventCategoryLabel(e.category),
      route: `/calendar/${e.id}`, relatedId: e.id, date: e.startDate, keywords: [e.location ?? '', e.department ?? '', e.organizer ?? ''], isSample: e.isSample,
    }))

  const kb = knowledgeBaseArticles.map((a): GlobalSearchResult => ({
    id: `helpdesk:${a.id}`, title: a.title, description: a.summary, type: 'helpdesk', category: 'IT Knowledge Base',
    route: `/helpdesk/knowledge-base/${a.id}`, relatedId: a.id, tags: a.tags, date: a.updatedAt, isFeatured: a.isFeatured, isSample: a.isSample,
  }))

  const jobItems = jobs.filter(isJobAcceptingCandidates).map((j): GlobalSearchResult => ({
    id: `job:${j.id}`, title: j.title, description: j.summary, type: 'job', category: j.department, route: `/recruitment/jobs/${j.id}`, relatedId: j.id,
    tags: [j.employmentType, j.workArrangement, ...(j.skills ?? [])], date: j.postedAt, keywords: [j.location, ...j.responsibilities], isSample: j.isSample,
  }))

  const resources = curatedResources.map((r): GlobalSearchResult => ({
    id: `resource:${r.id}`, title: r.title, description: r.description, type: 'resource', category: getResourceCategoryLabel(r.category), route: r.route, relatedId: r.id, tags: r.tags,
  }))

  const faqs = [
    ...resourceFaqs.map((f): GlobalSearchResult => ({
      id: `faq:${f.id}`, title: f.question, description: f.answer, type: 'faq', category: 'Employee FAQ', route: `/resources/faq?q=${encodeURIComponent(f.question)}`, relatedId: f.id, tags: f.tags,
    })),
    ...benefitFaqs.map((f): GlobalSearchResult => ({
      id: `faq:${f.id}`, title: f.question, description: f.answer, type: 'faq', category: 'Benefits FAQ', route: `/benefits/faq?q=${encodeURIComponent(f.question)}`, relatedId: f.id,
    })),
  ]

  const company: GlobalSearchResult[] = [
    ...companyPages,
    ...departments.map((d): GlobalSearchResult => ({
      id: `company:department-${d.id}`, title: `${d.name} Department`, description: d.description, type: 'company', category: 'Departments', route: '/company/departments', relatedId: d.id, isSample: d.status === 'placeholder',
    })),
    ...locations.map((l): GlobalSearchResult => ({
      id: `company:location-${l.id}`, title: l.name, description: 'Company location.', type: 'company', category: 'Locations', route: '/company/locations', relatedId: l.id, isSample: l.status === 'placeholder',
    })),
  ]

  // Directory: business information only (name, position, department, location, company email). No personal contact details.
  const directory = mockEmployees.map((e): GlobalSearchResult => ({
    id: `directory:${e.employeeId}`, title: `${e.firstName} ${e.lastName}`, description: `${e.position} · ${e.department} · ${e.location}`, type: 'directory', category: 'Employee Directory',
    route: `/directory/${e.employeeId}`, relatedId: e.employeeId, tags: [e.department, e.position], keywords: [e.email, e.location], isSample: true,
  }))

  return [...docs, ...forms, ...benefitItems, ...news, ...eventItems, ...kb, ...jobItems, ...resources, ...faqs, ...company, ...directory]
}

let indexPromise: Promise<IndexedResult[]> | undefined
/** The index is built once and reused. */
const getIndex = () => (indexPromise ??= buildResults().then(buildSearchIndex))

/** GET /api/search?q=&type=&sort=&page=&perPage= */
async function mockSearch(query: SearchQuery): Promise<SearchResponse> {
  const index = await getIndex()
  await wait()
  return searchIndex(index, query)
}

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const search: typeof mockSearch = isApiMode ? apiAdapter.search : mockSearch

import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/forms.api'
import { forms } from '@/data/forms'
import { getRequestCategoryLabel, requestCategories } from '@/data/requestCategories'
import { requestTypes } from '@/data/requestTypes'
import type { CatalogItem, CatalogQuery, EmployeeForm } from '@/types/form'
import type { EmployeeRequestType, RequestCategory } from '@/types/request'

/**
 * Service layer for forms and request types.
 * Maps to future endpoints: GET /api/forms, /api/forms/{id}, /api/request-types, /api/request-types/{id}.
 * Replace the bodies with `fetch` calls returning the same shapes; no component needs to change.
 */

const MOCK_LATENCY_MS = 200
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

export interface FormDetail {
  /** What the id refers to. */
  kind: 'form' | 'request'
  form?: EmployeeForm
  /** The request type to start (for request types and for online forms). */
  requestType?: EmployeeRequestType
}

/** Request types that an online form already wraps are listed once, through the form. */
const wrappedRequestTypeIds = () => new Set(forms.map((f) => f.requestTypeId).filter(Boolean))

function buildCatalog(): CatalogItem[] {
  const wrapped = wrappedRequestTypeIds()
  return [
    ...requestTypes.filter((r) => !wrapped.has(r.id)).map((requestType): CatalogItem => ({ kind: 'request', requestType })),
    ...forms.map((form): CatalogItem => ({ kind: 'form', form })),
  ]
}

const titleOf = (item: CatalogItem) => (item.kind === 'form' ? item.form.title : item.requestType.title)

function matchesSearch(item: CatalogItem, search: string) {
  const base = item.kind === 'form' ? item.form : item.requestType
  const haystack = [base.title, base.description, getRequestCategoryLabel(base.category), ...base.tags, item.kind === 'form' ? 'form' : 'request']
    .join(' ')
    .toLowerCase()
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

const statusOf = (item: CatalogItem) => (item.kind === 'request' ? item.requestType.status : 'available')

/** GET /api/forms + /api/request-types, combined for the landing page. */
async function mockGetCatalog(query: CatalogQuery = {}): Promise<CatalogItem[]> {
  await wait()
  return buildCatalog()
    .filter((item) => (query.search?.trim() ? matchesSearch(item, query.search) : true))
    .filter((item) => (query.kind ? item.kind === query.kind : true))
    .filter((item) => (query.category ? (item.kind === 'form' ? item.form.category : item.requestType.category) === query.category : true))
    .filter((item) => (query.status ? statusOf(item) === query.status : true))
    .sort((a, b) => titleOf(a).localeCompare(titleOf(b)))
}

async function mockGetFeaturedCatalog(limit = 6): Promise<CatalogItem[]> {
  await wait()
  return buildCatalog()
    .filter((item) => (item.kind === 'form' ? item.form.isFeatured : item.requestType.isFeatured))
    .sort((a, b) => titleOf(a).localeCompare(titleOf(b)))
    .slice(0, limit)
}

async function mockGetCategoryCounts(): Promise<{ id: RequestCategory; label: string; description: string; count: number }[]> {
  await wait()
  const catalog = buildCatalog()
  return requestCategories.map((c) => ({
    id: c.id,
    label: c.label,
    description: c.description,
    count: catalog.filter((item) => (item.kind === 'form' ? item.form.category : item.requestType.category) === c.id).length,
  }))
}

/** GET /api/forms/{id} or /api/request-types/{id}. Both are reachable at /forms/:formId. */
async function mockGetFormDetail(id: string): Promise<FormDetail | null> {
  await wait()
  const form = forms.find((f) => f.id === id)
  if (form) {
    return { kind: 'form', form, requestType: form.requestTypeId ? requestTypes.find((r) => r.id === form.requestTypeId) : undefined }
  }
  const requestType = requestTypes.find((r) => r.id === id)
  return requestType ? { kind: 'request', requestType } : null
}

/** The form (if any) that points at a Documents record. Used to link Documents back to Forms. */
async function mockGetFormByDocumentId(documentId: string): Promise<EmployeeForm | null> {
  await wait()
  return forms.find((f) => f.documentId === documentId) ?? null
}

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getCatalog: typeof mockGetCatalog = isApiMode ? apiAdapter.getCatalog : mockGetCatalog
export const getFeaturedCatalog: typeof mockGetFeaturedCatalog = isApiMode ? apiAdapter.getFeaturedCatalog : mockGetFeaturedCatalog
export const getCategoryCounts: typeof mockGetCategoryCounts = isApiMode ? apiAdapter.getCategoryCounts : mockGetCategoryCounts
export const getFormDetail: typeof mockGetFormDetail = isApiMode ? apiAdapter.getFormDetail : mockGetFormDetail
export const getFormByDocumentId: typeof mockGetFormByDocumentId = isApiMode ? apiAdapter.getFormByDocumentId : mockGetFormByDocumentId

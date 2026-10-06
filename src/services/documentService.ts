import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/documents.api'
import { DOCUMENT_PAGE_SIZE, documentCategories } from '@/data/documentCategories'
import { documents } from '@/data/documents'
import type { PaginatedResponse } from '@/types/employee'
import type { DocumentCategorySummary, DocumentQuery, DocumentResource } from '@/types/document'

/**
 * Service layer for documents.
 * Each function maps to a future Laravel endpoint; replace the body with a `fetch` call that
 * returns the same shape and no component needs to change.
 */

const MOCK_LATENCY_MS = 250
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

const published = () => documents.filter((d) => d.status !== 'archived')

function matchesSearch(doc: DocumentResource, search: string) {
  const category = documentCategories.find((c) => c.id === doc.category)?.label ?? ''
  const haystack = [doc.title, doc.description, category, doc.department, ...doc.tags].join(' ').toLowerCase()
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

function compare(a: DocumentResource, b: DocumentResource, sort: NonNullable<DocumentQuery['sort']>) {
  switch (sort) {
    case 'added':
      return b.createdAt.localeCompare(a.createdAt) || a.title.localeCompare(b.title)
    case 'az':
      return a.title.localeCompare(b.title)
    case 'za':
      return b.title.localeCompare(a.title)
    default:
      return b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title)
  }
}

/** GET /api/documents */
async function mockGetDocuments(query: DocumentQuery = {}): Promise<PaginatedResponse<DocumentResource>> {
  await wait()
  const { search, category, department, fileType, sort = 'updated', page = 1, perPage = DOCUMENT_PAGE_SIZE } = query

  const filtered = published()
    .filter((d) => (search?.trim() ? matchesSearch(d, search) : true))
    .filter((d) => (category ? d.category === category : true))
    .filter((d) => (department ? d.department === department : true))
    .filter((d) => (fileType ? d.fileType === fileType : true))
    .sort((a, b) => compare(a, b, sort))

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * perPage

  return { data: filtered.slice(start, start + perPage), current_page: currentPage, per_page: perPage, total, last_page: lastPage }
}

/** GET /api/documents/{id} */
async function mockGetDocument(id: string): Promise<DocumentResource | null> {
  await wait()
  return published().find((d) => d.id === id) ?? null
}

/** GET /api/documents/categories */
async function mockGetDocumentCategories(): Promise<DocumentCategorySummary[]> {
  await wait()
  return documentCategories.map((c) => ({ ...c, count: published().filter((d) => d.category === c.id).length }))
}

/** GET /api/documents/recent */
async function mockGetRecentDocuments(limit = 5): Promise<DocumentResource[]> {
  await wait()
  return [...published()].sort((a, b) => compare(a, b, 'updated')).slice(0, limit)
}

/** GET /api/documents/popular */
async function mockGetFrequentlyUsedDocuments(limit = 6): Promise<DocumentResource[]> {
  await wait()
  return published()
    .filter((d) => d.isFrequentlyUsed)
    .slice(0, limit)
}

/** Documents related to another (same category), for the detail page. */
async function mockGetRelatedDocuments(doc: DocumentResource, limit = 4): Promise<DocumentResource[]> {
  await wait()
  return published()
    .filter((d) => d.category === doc.category && d.id !== doc.id)
    .sort((a, b) => compare(a, b, 'updated'))
    .slice(0, limit)
}

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getDocuments: typeof mockGetDocuments = isApiMode ? apiAdapter.getDocuments : mockGetDocuments
export const getDocument: typeof mockGetDocument = isApiMode ? apiAdapter.getDocument : mockGetDocument
export const getDocumentCategories: typeof mockGetDocumentCategories = isApiMode ? apiAdapter.getDocumentCategories : mockGetDocumentCategories
export const getRecentDocuments: typeof mockGetRecentDocuments = isApiMode ? apiAdapter.getRecentDocuments : mockGetRecentDocuments
export const getFrequentlyUsedDocuments: typeof mockGetFrequentlyUsedDocuments = isApiMode ? apiAdapter.getFrequentlyUsedDocuments : mockGetFrequentlyUsedDocuments
export const getRelatedDocuments: typeof mockGetRelatedDocuments = isApiMode ? apiAdapter.getRelatedDocuments : mockGetRelatedDocuments

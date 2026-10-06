import { DOCUMENT_PAGE_SIZE, documentCategories } from '@/data/documentCategories'
import { api } from '@/services/api'
import { toPaginated, type ApiPage } from '@/services/adapters/paginate'
import type { ApiResponse } from '@/types/api'
import type { DocumentAccessLevel, DocumentCategory, DocumentCategorySummary, DocumentFileType, DocumentQuery, DocumentResource } from '@/types/document'
import type { PaginatedResponse } from '@/types/employee'

/**
 * Documents, Laravel adapter. Laravel filters by access level on the server, so a document the employee may not open is never
 * returned (and a direct request for it is a 404). Only metadata exists: there is no file storage yet, so the page keeps its
 * "not connected" state for View/Download.
 */
interface ApiDocument {
  id: number
  title: string
  description: string | null
  category?: { id: number; name: string; slug: string }
  department: string | null
  file_type: string | null
  file_size: number | null
  version: string | null
  owner: string | null
  access_level: DocumentAccessLevel
  published_at: string | null
  updated_at: string | null
  is_sample?: boolean
}

const KNOWN = new Set<string>(documentCategories.map((c) => c.id))
const formatSize = (bytes: number | null) => (bytes === null ? undefined : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`)

const toDocument = (d: ApiDocument): DocumentResource => ({
  id: String(d.id),
  title: d.title,
  description: d.description ?? '',
  category: (d.category && KNOWN.has(d.category.slug) ? d.category.slug : 'company') as DocumentCategory,
  department: d.department ?? '',
  fileType: (d.file_type ?? 'PDF') as DocumentFileType,
  fileSize: formatSize(d.file_size),
  version: d.version ?? undefined,
  owner: d.owner ?? undefined,
  updatedAt: (d.updated_at ?? d.published_at ?? '').slice(0, 10),
  createdAt: (d.published_at ?? d.updated_at ?? '').slice(0, 10),
  tags: [],
  accessLevel: d.access_level,
  isSample: d.is_sample,
})

const SORTS = { updated: ['updated_at', 'desc'], added: ['published_at', 'desc'], az: ['title', 'asc'], za: ['title', 'desc'] } as const

export async function getDocuments(query: DocumentQuery = {}): Promise<PaginatedResponse<DocumentResource>> {
  const { search, category, department, fileType, sort = 'updated', page = 1, perPage = DOCUMENT_PAGE_SIZE } = query
  const [column, direction] = SORTS[sort]
  const result = await api.get<ApiPage<ApiDocument>>('/api/documents', {
    search: search?.trim(), category, department, file_type: fileType, sort: column, direction, page, per_page: perPage,
  })
  return toPaginated(result, toDocument)
}

export async function getDocument(id: string): Promise<DocumentResource | null> {
  try {
    return toDocument((await api.get<ApiResponse<ApiDocument>>(`/api/documents/${encodeURIComponent(id)}`)).data)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

export async function getDocumentCategories(): Promise<DocumentCategorySummary[]> {
  const result = await api.get<ApiResponse<{ slug: string; documents_count?: number }[]>>('/api/documents/categories')
  const counts = new Map(result.data.map((c) => [c.slug, c.documents_count ?? 0]))
  // Categories the employee has no documents in are left out, so nothing reveals what exists.
  return documentCategories.filter((c) => counts.has(c.id)).map((c) => ({ ...c, count: counts.get(c.id) ?? 0 }))
}

export async function getRecentDocuments(limit = 5): Promise<DocumentResource[]> {
  return (await api.get<ApiResponse<ApiDocument[]>>('/api/documents/recent', { limit })).data.map(toDocument)
}

export async function getFrequentlyUsedDocuments(limit = 6): Promise<DocumentResource[]> {
  return (await api.get<ApiResponse<ApiDocument[]>>('/api/documents/popular', { limit })).data.map(toDocument)
}

export async function getRelatedDocuments(doc: DocumentResource, limit = 4): Promise<DocumentResource[]> {
  const result = await api.get<ApiPage<ApiDocument>>('/api/documents', { category: doc.category, per_page: limit + 1 })
  return result.data.map(toDocument).filter((d) => d.id !== doc.id).slice(0, limit)
}

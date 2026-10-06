import { requestCategories } from '@/data/requestCategories'
import { requestTypes as requestTypeCatalog } from '@/data/requestTypes'
import { api } from '@/services/api'
import type { ApiPage } from '@/services/adapters/paginate'
import type { CatalogItem, CatalogQuery, EmployeeForm } from '@/types/form'
import type { EmployeeRequestType, RequestCategory } from '@/types/request'
import type { FormDetail } from '@/services/formService'

/**
 * Forms and request types, Laravel adapter: GET /api/forms[/{id}] and GET /api/request-types.
 * Laravel decides which forms and request types exist and are available. The portal's request type catalog
 * (src/data/requestTypes.ts) supplies only presentation (dedicated page route, tags, instructions); the form FIELDS
 * come from Laravel when it has them. A form points at its document by id: document metadata is never duplicated.
 */
interface ApiForm {
  id: number
  title: string
  description: string | null
  category: RequestCategory
  form_type: 'download' | 'online'
  instructions: string | null
  document_id: number | null
  request_type_id: number | null
  is_sample?: boolean
}

interface ApiRequestType {
  id: number
  code: string
  name: string
  description: string | null
  category: string
  requires_attachment: boolean
  requires_approval: boolean
  fields: EmployeeRequestType['fields']
  is_sample?: boolean
}

async function load(): Promise<{ forms: EmployeeForm[]; types: EmployeeRequestType[] }> {
  const [formPage, typePage] = await Promise.all([
    api.get<ApiPage<ApiForm>>('/api/forms', { per_page: 100 }),
    api.get<ApiPage<ApiRequestType>>('/api/request-types', { per_page: 100 }),
  ])
  const codeById = new Map(typePage.data.map((t) => [t.id, t.code]))

  const types = typePage.data.map((t): EmployeeRequestType => {
    const known = requestTypeCatalog.find((c) => c.id === t.code)
    const category = (t.category === 'benefits' ? 'hr' : t.category) as RequestCategory
    return {
      tags: [],
      ...known,
      id: t.code,
      title: t.name,
      description: t.description ?? known?.description ?? '',
      category,
      status: 'available',
      requiresAttachment: t.requires_attachment,
      requiresApproval: t.requires_approval,
      fields: t.fields.length > 0 || !known ? t.fields : known.fields,
      isSample: t.is_sample,
    }
  })

  const forms = formPage.data.map(
    (f): EmployeeForm => ({
      id: String(f.id),
      title: f.title,
      description: f.description ?? '',
      category: f.category,
      type: f.form_type,
      documentId: f.document_id === null ? undefined : String(f.document_id),
      requestTypeId: f.request_type_id === null ? undefined : codeById.get(f.request_type_id),
      tags: [],
      instructions: f.instructions ? [f.instructions] : undefined,
      isSample: f.is_sample,
    }),
  )
  return { forms, types }
}

function buildCatalog({ forms, types }: { forms: EmployeeForm[]; types: EmployeeRequestType[] }): CatalogItem[] {
  const wrapped = new Set(forms.map((f) => f.requestTypeId).filter(Boolean))
  return [
    ...types.filter((t) => !wrapped.has(t.id)).map((requestType): CatalogItem => ({ kind: 'request', requestType })),
    ...forms.map((form): CatalogItem => ({ kind: 'form', form })),
  ]
}

const titleOf = (item: CatalogItem) => (item.kind === 'form' ? item.form.title : item.requestType.title)
const categoryOf = (item: CatalogItem) => (item.kind === 'form' ? item.form.category : item.requestType.category)

export async function getCatalog(query: CatalogQuery = {}): Promise<CatalogItem[]> {
  const search = query.search?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? []
  return buildCatalog(await load())
    .filter((item) => {
      if (search.length === 0) return true
      const base = item.kind === 'form' ? item.form : item.requestType
      const haystack = [base.title, base.description, ...base.tags].join(' ').toLowerCase()
      return search.every((term) => haystack.includes(term))
    })
    .filter((item) => (query.kind ? item.kind === query.kind : true))
    .filter((item) => (query.category ? categoryOf(item) === query.category : true))
    .filter((item) => (query.status && item.kind === 'request' ? item.requestType.status === query.status : true))
    .sort((a, b) => titleOf(a).localeCompare(titleOf(b)))
}

export async function getFeaturedCatalog(limit = 6): Promise<CatalogItem[]> {
  return buildCatalog(await load())
    .filter((item) => (item.kind === 'form' ? item.form.isFeatured : item.requestType.isFeatured))
    .sort((a, b) => titleOf(a).localeCompare(titleOf(b)))
    .slice(0, limit)
}

export async function getCategoryCounts(): Promise<{ id: RequestCategory; label: string; description: string; count: number }[]> {
  const catalog = buildCatalog(await load())
  return requestCategories.map((c) => ({ id: c.id, label: c.label, description: c.description, count: catalog.filter((i) => categoryOf(i) === c.id).length }))
}

export async function getFormDetail(id: string): Promise<FormDetail | null> {
  const data = await load()
  const form = data.forms.find((f) => f.id === id)
  if (form) return { kind: 'form', form, requestType: form.requestTypeId ? data.types.find((t) => t.id === form.requestTypeId) : undefined }
  const requestType = data.types.find((t) => t.id === id)
  if (requestType) return { kind: 'request', requestType }
  return null
}

export async function getFormByDocumentId(documentId: string): Promise<EmployeeForm | null> {
  return (await load()).forms.find((f) => f.documentId === documentId) ?? null
}

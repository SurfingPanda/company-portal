import { requestTypes } from '@/data/requestTypes'
import { formatDate } from '@/lib/format'
import { buildTimelineFor, departmentForCategory } from '@/lib/requests'
import { api } from '@/services/api'
import type { ApiResponse } from '@/types/api'
import type { EmployeeRequest, NewRequestPayload, RequestCategory, RequestStatus, SubmittedAnswer } from '@/types/request'

/**
 * Requests, Laravel adapter. Wire format is snake_case (see API.md); this file maps it to the portal's `EmployeeRequest`.
 * The reference number, status and history come from Laravel; nothing is generated in the browser.
 *
 *   GET  /api/requests, GET /api/requests/{id}, POST /api/requests, POST /api/requests/{id}/cancel
 *   POST /api/requests/{id}/attachments, GET /api/request-types
 */

interface ApiHistory { id: number; status: RequestStatus; comment: string | null; actor: string; created_at: string }
interface ApiRequest {
  id: number
  reference_number: string
  request_type: { id: number; code: string; name: string; category: string }
  subject: string
  description: string | null
  form_data: Record<string, unknown> | unknown[]
  status: RequestStatus
  submitted_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  history?: ApiHistory[]
  attachments?: { id: number; filename: string; file_size: number }[]
  is_sample?: boolean
}

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`)

/** The backend also has a "benefits" category; the portal files benefits requests under HR. */
const toCategory = (category: string): RequestCategory => (category === 'benefits' ? 'hr' : (category as RequestCategory))

function toRequest(r: ApiRequest): EmployeeRequest {
  const category = toCategory(r.request_type.category)
  const catalog = requestTypes.find((t) => t.id === r.request_type.code)
  const raw = (Array.isArray(r.form_data) ? {} : r.form_data) as Record<string, unknown>
  const values: Record<string, string> = {}
  const answers: SubmittedAnswer[] = []
  for (const field of catalog?.fields ?? []) {
    const value = raw[field.id]
    if (value === undefined || value === null || value === '' || value === false) continue
    const text = value === true ? 'Yes' : String(value)
    values[field.id] = value === true ? 'true' : String(value)
    answers.push({ fieldId: field.id, label: field.label, value: field.type === 'date' ? formatDate(text, 'long') : text })
  }
  const submittedAt = r.submitted_at ?? r.created_at
  const department = departmentForCategory(category)
  return {
    id: String(r.id),
    reference: r.reference_number,
    requestTypeId: r.request_type.code,
    requestTypeTitle: r.request_type.name,
    category,
    title: r.subject,
    description: r.description ?? '',
    status: r.status,
    submittedAt,
    updatedAt: r.updated_at,
    answers,
    values,
    attachments: (r.attachments ?? []).map((a) => ({ id: String(a.id), name: a.filename, size: formatSize(a.file_size) })),
    timeline: buildTimelineFor(category, r.status, submittedAt, r.updated_at, department),
    assignedDepartment: department,
    completedAt: r.completed_at ?? undefined,
    isSample: r.is_sample,
  }
}

/** Notifications link to a reference ("/requests/REQ-2026-0001"); the API addresses requests by numeric id. */
async function resolveId(id: string): Promise<string | null> {
  if (/^\d+$/.test(id)) return id
  const found = await api.get<ApiResponse<ApiRequest[]>>('/api/requests', { search: id, per_page: 5 })
  return found.data.find((r) => r.reference_number.toLowerCase() === id.toLowerCase())?.id.toString() ?? null
}

export async function getRequests(): Promise<EmployeeRequest[]> {
  const response = await api.get<ApiResponse<ApiRequest[]>>('/api/requests', { per_page: 100, sort: 'created_at', direction: 'desc' })
  return response.data.map(toRequest)
}

export async function getRecentRequests(limit = 3): Promise<EmployeeRequest[]> {
  const response = await api.get<ApiResponse<ApiRequest[]>>('/api/requests', { per_page: limit, sort: 'created_at', direction: 'desc' })
  return response.data.map(toRequest)
}

export async function getRequest(id: string): Promise<EmployeeRequest | null> {
  const numeric = await resolveId(id)
  if (numeric === null) return null
  try {
    const response = await api.get<ApiResponse<ApiRequest>>(`/api/requests/${numeric}`)
    return toRequest(response.data)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

let typeIds: Promise<Map<string, number>> | undefined

/** Frontend request types are identified by code; Laravel by numeric id. Resolved once from GET /api/request-types. */
function backendTypeId(code: string): Promise<number | undefined> {
  typeIds ??= api.get<ApiResponse<{ id: number; code: string }[]>>('/api/request-types', { per_page: 100 }).then(
    (r) => new Map(r.data.map((t) => [t.code, t.id])),
    (error) => {
      typeIds = undefined
      throw error
    },
  )
  return typeIds.then((map) => map.get(code))
}

export async function submitRequest(payload: NewRequestPayload): Promise<EmployeeRequest> {
  const typeId = await backendTypeId(payload.requestType.id)
  if (typeId === undefined) throw new Error('This request type is not available from the portal service.')

  const formData: Record<string, string | boolean> = {}
  for (const field of payload.requestType.fields) {
    const value = payload.values[field.id]
    if (field.type === 'checkbox') formData[field.id] = value === 'true'
    else if (value !== undefined && value.trim() !== '') formData[field.id] = value.trim()
  }

  const created = await api.post<ApiResponse<ApiRequest>>('/api/requests', {
    request_type_id: typeId,
    subject: payload.title.trim(),
    description: payload.description.trim(),
    form_data: formData,
  })

  if (payload.file) {
    const form = new FormData()
    form.append('file', payload.file)
    try {
      await api.upload(`/api/requests/${created.data.id}/attachments`, form)
    } catch {
      // The request itself exists with its Laravel reference. Tell the caller the file did not make it, never claim success.
      const withoutFile = toRequest(created.data)
      return { ...withoutFile, attachments: [], description: withoutFile.description }
    }
    return (await getRequest(String(created.data.id))) ?? toRequest(created.data)
  }
  return toRequest(created.data)
}

export async function cancelRequest(id: string): Promise<EmployeeRequest> {
  const response = await api.post<ApiResponse<ApiRequest>>(`/api/requests/${id}/cancel`)
  return toRequest(response.data)
}

import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/requests.api'
import { leaveRequests } from '@/data/leaveRequests'
import { mockRequests } from '@/data/mockRequests'
import { formatDate } from '@/lib/format'
import { buildTimelineFor, compareRequests, departmentForCategory, makeReference } from '@/lib/requests'
import type { EmployeeRequest, NewRequestPayload, SubmittedAnswer } from '@/types/request'

/**
 * Service layer for submitted requests.
 * Maps to future endpoints: GET /api/requests, GET /api/requests/{id}, POST /api/requests,
 * POST /api/requests/{id}/attachments.
 *
 * PROTOTYPE: submitted requests are kept in this in-memory list only. They are NOT sent to a server,
 * and they disappear on page reload. Replace `submitRequest` with a POST call when Laravel exists.
 */

const MOCK_LATENCY_MS = 250
const wait = (ms = MOCK_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms))

let store: EmployeeRequest[] = [...mockRequests, ...leaveRequests]

/** GET /api/requests (the signed-in employee's requests; sorted newest first). */
async function mockGetRequests(): Promise<EmployeeRequest[]> {
  await wait()
  return [...store].sort(compareRequests)
}

/** GET /api/requests/{id} */
async function mockGetRequest(id: string): Promise<EmployeeRequest | null> {
  await wait()
  return store.find((r) => r.id.toLowerCase() === id.toLowerCase()) ?? null
}

async function mockGetRecentRequests(limit = 3): Promise<EmployeeRequest[]> {
  await wait()
  return [...store].sort(compareRequests).slice(0, limit)
}

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`)

function toAnswers(payload: NewRequestPayload): SubmittedAnswer[] {
  return payload.requestType.fields
    .map((field): SubmittedAnswer | null => {
      const raw = payload.values[field.id]?.trim() ?? ''
      if (field.type === 'checkbox') return payload.values[field.id] === 'true' ? { fieldId: field.id, label: field.label, value: 'Yes' } : null
      if (!raw) return null
      return { fieldId: field.id, label: field.label, value: field.type === 'date' ? formatDate(raw, 'long') : raw }
    })
    .filter((a): a is SubmittedAnswer => a !== null)
}

/** POST /api/requests (+ POST /api/requests/{id}/attachments for the file). Mock only: nothing is stored remotely. */
async function mockSubmitRequest(payload: NewRequestPayload): Promise<EmployeeRequest> {
  await wait(800)

  const now = new Date()
  const iso = formatIso(now)
  const prefix = payload.requestType.referencePrefix ?? 'REQ'
  const sequence = store.filter((r) => r.reference.startsWith(`${prefix}-`)).reduce((max, r) => Math.max(max, Number(r.reference.slice(-4))), 0) + 1
  const reference = makeReference(now.getFullYear(), sequence, prefix)
  const department = departmentForCategory(payload.requestType.category)

  const request: EmployeeRequest = {
    id: reference,
    reference,
    requestTypeId: payload.requestType.id,
    requestTypeTitle: payload.requestType.title,
    category: payload.requestType.category,
    title: payload.title.trim(),
    description: payload.description.trim(),
    status: 'submitted',
    submittedAt: iso,
    updatedAt: iso,
    answers: toAnswers(payload),
    values: payload.values,
    attachments: payload.attachment ? [{ id: `att-${reference}`, name: payload.attachment.name, size: formatSize(payload.attachment.size) }] : [],
    timeline: buildTimelineFor(payload.requestType.category, 'submitted', iso, iso, department),
    assignedDepartment: department,
    isSample: true,
  }

  store = [request, ...store]
  return request
}

function formatIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getRequests: typeof mockGetRequests = isApiMode ? apiAdapter.getRequests : mockGetRequests
export const getRequest: typeof mockGetRequest = isApiMode ? apiAdapter.getRequest : mockGetRequest
export const getRecentRequests: typeof mockGetRecentRequests = isApiMode ? apiAdapter.getRecentRequests : mockGetRecentRequests
export const submitRequest: typeof mockSubmitRequest = isApiMode ? apiAdapter.submitRequest : mockSubmitRequest

/** POST /api/requests/{id}/cancel. In mock mode the sample request is marked cancelled in memory. */
async function mockCancelRequest(id: string): Promise<EmployeeRequest> {
  await wait()
  const found = store.find((r) => r.id === id)
  if (!found) throw new Error('Request not found')
  const updated: EmployeeRequest = { ...found, status: 'cancelled', updatedAt: formatIso(new Date()), timeline: buildTimelineFor(found.category, 'cancelled', found.submittedAt, formatIso(new Date()), found.assignedDepartment ?? '') }
  store = store.map((r) => (r.id === id ? updated : r))
  return updated
}
export const cancelRequest: typeof mockCancelRequest = isApiMode ? apiAdapter.cancelRequest : mockCancelRequest

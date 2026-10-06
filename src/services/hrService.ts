import { hrResourceLinks, hrServices } from '@/data/hrServices'
import { leaveTypes } from '@/data/leaveRequests'
import { requestTypes } from '@/data/requestTypes'
import { formatDate } from '@/lib/format'
import { isLeaveRequest, LEAVE_REQUEST_TYPE_ID, toLeaveRequest } from '@/lib/leave'
import { getRequests, submitRequest } from '@/services/requestService'
import type { PaginatedResponse } from '@/types/employee'
import type { HRResourceLink, HRService, HRServiceQuery, LeaveRequest, LeaveRequestQuery, LeaveType } from '@/types/hr'
import type { EmployeeRequest } from '@/types/request'
import { requestStatusLabels } from '@/data/requestCategories'

/**
 * Service layer for HR services and leave requests.
 *
 *   getHRServices       GET  /api/hr/services            getHRService       GET  /api/hr/services/{id}
 *   getLeaveTypes       GET  /api/leave/types
 *   getLeaveRequests    GET  /api/leave/requests         getLeaveRequest    GET  /api/leave/requests/{id}
 *   submitLeaveRequest  POST /api/leave/requests (+ POST /api/leave/requests/{id}/attachments)
 *   getHRResources      GET  /api/hr/resources  (benefits live in the Benefits module: services/benefitService.ts)
 *
 * Leave requests are ordinary Phase 8 requests (type `rt-leave`), stored by `requestService`. This module adds no
 * second request store. HR owns the records: nothing here computes balances, entitlement or approvals.
 * The future backend must return only the signed-in employee's own requests.
 */

const MOCK_LATENCY_MS = 200
const wait = (ms = MOCK_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const LEAVE_PAGE_SIZE = 8

const matches = (haystack: string, search: string) =>
  search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.toLowerCase().includes(term))

/** GET /api/hr/services */
export async function getHRServices(query: HRServiceQuery = {}): Promise<HRService[]> {
  await wait()
  return hrServices
    .filter((s) => (query.category ? s.category === query.category : true))
    .filter((s) => (query.search?.trim() ? matches([s.name, s.description, s.category].join(' '), query.search) : true))
}

/** GET /api/hr/services/{id} */
export async function getHRService(id: string): Promise<HRService | null> {
  await wait()
  return hrServices.find((s) => s.id === id) ?? null
}

/** GET /api/leave/types */
export async function getLeaveTypes(): Promise<LeaveType[]> {
  await wait()
  return leaveTypes
}

async function loadLeaveRequests(): Promise<LeaveRequest[]> {
  const all = await getRequests()
  return all.map((r) => (isLeaveRequest(r) ? toLeaveRequest(r) : null)).filter((r): r is LeaveRequest => r !== null)
}

/** GET /api/leave/requests (the signed-in employee's own requests only). */
export async function getLeaveRequests(query: LeaveRequestQuery = {}): Promise<PaginatedResponse<LeaveRequest>> {
  const { search, status, from, to, sort = 'submitted-desc', page = 1, perPage = LEAVE_PAGE_SIZE } = query
  const all = await loadLeaveRequests()

  const filtered = all
    .filter((r) => (search?.trim() ? matches([r.reference, r.leaveType, r.reason, requestStatusLabels[r.status], formatDate(r.startDate, 'long')].join(' '), search) : true))
    .filter((r) => (status ? r.status === status : true))
    // Overlap with the chosen range: leave ends on/after "from" and starts on/before "to".
    .filter((r) => (from ? r.endDate >= from : true))
    .filter((r) => (to ? r.startDate <= to : true))
    .sort((a, b) => {
      if (sort === 'submitted-asc') return (a.submittedAt ?? a.updatedAt).localeCompare(b.submittedAt ?? b.updatedAt)
      if (sort === 'start-asc') return a.startDate.localeCompare(b.startDate)
      if (sort === 'start-desc') return b.startDate.localeCompare(a.startDate)
      return (b.submittedAt ?? b.updatedAt).localeCompare(a.submittedAt ?? a.updatedAt)
    })

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * perPage
  return { data: filtered.slice(start, start + perPage), current_page: currentPage, per_page: perPage, total, last_page: lastPage }
}

export async function getRecentLeaveRequests(limit = 3): Promise<LeaveRequest[]> {
  const all = await loadLeaveRequests()
  return all.slice(0, limit)
}

/** GET /api/leave/requests/{id} */
export async function getLeaveRequest(id: string): Promise<LeaveRequest | null> {
  const all = await loadLeaveRequests()
  return all.find((r) => r.id.toLowerCase() === id.toLowerCase()) ?? null
}

export const getLeaveRequestType = () => requestTypes.find((t) => t.id === LEAVE_REQUEST_TYPE_ID)!

/** POST /api/leave/requests. Mock only: creates an LV-YYYY-NNNN request in the shared in-memory request store. */
export async function submitLeaveRequest(values: Record<string, string>, attachment?: { name: string; size: number }, file?: File): Promise<EmployeeRequest> {
  return submitRequest({
    requestType: getLeaveRequestType(),
    title: values['leave-type'],
    description: values.reason,
    values,
    attachment,
    file,
  })
}


/** GET /api/hr/resources */
export async function getHRResources(): Promise<HRResourceLink[]> {
  await wait()
  return hrResourceLinks
}


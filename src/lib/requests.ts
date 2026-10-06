import { getRequestCategory } from '@/data/requestCategories'
import type { EmployeeRequest, RequestCategory, RequestStatus, RequestTimelineEntry } from '@/types/request'

/** Department responsible for a request category (generic labels, never employee names). */
export const departmentForCategory = (category: RequestCategory) => getRequestCategory(category)?.department ?? 'Administration Department'

/**
 * Simple display timeline derived from a status. This is NOT a workflow engine: the backend will
 * supply real timeline entries; this only lets the UI show the shape of one.
 */
export function buildTimeline(status: RequestStatus, submittedAt: string, updatedAt: string, department: string): RequestTimelineEntry[] {
  const submitted: RequestTimelineEntry = { id: 't-submitted', label: 'Submitted', state: 'done', timestamp: submittedAt, description: 'Request received.', actor: 'Employee Portal' }
  const pending = (id: string, label: string): RequestTimelineEntry => ({ id, label, state: 'pending' })
  const reviewDone: RequestTimelineEntry = { id: 't-review', label: 'Under Review', state: 'done', timestamp: updatedAt, actor: department }

  switch (status) {
    case 'draft':
      return [{ id: 't-draft', label: 'Draft', state: 'current', timestamp: updatedAt, description: 'Not yet submitted.' }]
    case 'submitted':
      return [submitted, pending('t-review', 'Under Review'), pending('t-completed', 'Completed')]
    case 'under-review':
      return [submitted, { id: 't-review', label: 'Under Review', state: 'current', timestamp: updatedAt, actor: department }, pending('t-completed', 'Completed')]
    case 'approved':
      return [submitted, reviewDone, { id: 't-approved', label: 'Approved', state: 'done', timestamp: updatedAt, actor: department }, pending('t-completed', 'Completed')]
    case 'rejected':
      return [submitted, reviewDone, { id: 't-rejected', label: 'Rejected', state: 'done', timestamp: updatedAt, actor: department }]
    case 'completed':
      return [submitted, reviewDone, { id: 't-completed', label: 'Completed', state: 'done', timestamp: updatedAt, actor: department }]
    case 'cancelled':
      return [submitted, { id: 't-cancelled', label: 'Cancelled', state: 'done', timestamp: updatedAt }]
  }
}

/**
 * HR timeline: the same display steps plus "Request Created" first, and an "Approved / Rejected"
 * step while the decision is still ahead. Display only; HR owns the real workflow.
 */
export function buildHrTimeline(status: RequestStatus, createdAt: string, submittedAt: string, updatedAt: string, department: string): RequestTimelineEntry[] {
  const base = buildTimeline(status, submittedAt, updatedAt, department)
  if (status === 'draft') return base
  const created: RequestTimelineEntry = { id: 't-created', label: 'Request Created', state: 'done', timestamp: createdAt, actor: 'Employee Portal' }
  const waiting = status === 'submitted' || status === 'under-review'
  const steps = waiting ? [...base.slice(0, -1), { id: 't-decision', label: 'Approved / Rejected', state: 'pending' as const }, ...base.slice(-1)] : base
  return [created, ...steps]
}

/** Timeline for a request category (HR requests use the longer HR timeline). */
export const buildTimelineFor = (category: RequestCategory, status: RequestStatus, submittedAt: string, updatedAt: string, department: string) =>
  category === 'hr' ? buildHrTimeline(status, submittedAt, submittedAt, updatedAt, department) : buildTimeline(status, submittedAt, updatedAt, department)

/** REQ-2026-0001 style reference; the prefix names the request family (e.g. LV for leave). */
export const makeReference = (year: number, sequence: number, prefix = 'REQ') => `${prefix}-${year}-${String(sequence).padStart(4, '0')}`

export const compareRequests = (a: EmployeeRequest, b: EmployeeRequest) => b.submittedAt.localeCompare(a.submittedAt)

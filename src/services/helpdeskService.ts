import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/helpdesk.api'
import { currentUser } from '@/data/currentUser'
import { TICKET_PAGE_SIZE, getKnowledgeBaseCategoryLabel, getTicketCategoryLabel, supportContact, ticketCategoryOptions } from '@/data/helpdeskOptions'
import { mockTickets } from '@/data/helpdeskTickets'
import { knowledgeBaseArticles } from '@/data/knowledgeBase'
import type { PaginatedResponse } from '@/types/employee'
import type { HelpdeskTicket, NewTicketPayload, SupportContact, TicketQuery } from '@/types/helpdesk'
import type { KnowledgeBaseArticle, KnowledgeBaseQuery } from '@/types/knowledgeBase'

/**
 * Service layer for the IT helpdesk. Each function maps to a future Laravel endpoint, which may itself
 * forward to the organization's ticketing system; nothing here assumes a particular vendor.
 *   getTickets        GET  /api/helpdesk/tickets          getTicket     GET  /api/helpdesk/tickets/{id}
 *   createTicket      POST /api/helpdesk/tickets          getCategories GET  /api/helpdesk/categories
 *   getArticles       GET  /api/helpdesk/knowledge-base   getArticle    GET  /api/helpdesk/knowledge-base/{id}
 * Replies and attachments (POST .../replies, .../attachments) are not here yet; the ticket page keeps replies in local state.
 *
 * PROTOTYPE: tickets live in this in-memory list only. Employees would only ever receive their own tickets from the server.
 */

const MOCK_LATENCY_MS = 250
const wait = (ms = MOCK_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms))

let store: HelpdeskTicket[] = [...mockTickets]

const pad = (n: number) => String(n).padStart(2, '0')
const nowIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function matchesTicket(t: HelpdeskTicket, search: string) {
  const haystack = [t.reference, t.subject, t.description, getTicketCategoryLabel(t.category)].join(' ').toLowerCase()
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

/** GET /api/helpdesk/tickets */
async function mockGetTickets(query: TicketQuery = {}): Promise<PaginatedResponse<HelpdeskTicket>> {
  await wait()
  const { search, status, category, priority, sort = 'updated', page = 1, perPage = TICKET_PAGE_SIZE } = query

  const filtered = store
    .filter((t) => (search?.trim() ? matchesTicket(t, search) : true))
    .filter((t) => (status ? t.status === status : true))
    .filter((t) => (category ? t.category === category : true))
    .filter((t) => (priority ? t.priority === priority : true))
    .sort((a, b) => {
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt)
      if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt)
      return b.updatedAt.localeCompare(a.updatedAt)
    })

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * perPage
  return { data: filtered.slice(start, start + perPage), current_page: currentPage, per_page: perPage, total, last_page: lastPage }
}

async function mockGetRecentTickets(limit = 3): Promise<HelpdeskTicket[]> {
  await wait()
  return [...store].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit)
}

/** GET /api/helpdesk/tickets/{id} */
async function mockGetTicket(id: string): Promise<HelpdeskTicket | null> {
  await wait()
  return store.find((t) => t.id.toLowerCase() === id.toLowerCase() || t.reference.toLowerCase() === id.toLowerCase()) ?? null
}

/** POST /api/helpdesk/tickets (mock: kept in memory; nothing is sent to a ticketing system). */
async function mockCreateTicket(payload: NewTicketPayload): Promise<HelpdeskTicket> {
  await wait(800)
  const sequence = store.reduce((max, t) => Math.max(max, Number(t.reference.slice(-5))), 0) + 1
  const prefix = payload.type === 'incident' ? 'INC' : 'REQ'
  const now = nowIso()

  const ticket: HelpdeskTicket = {
    id: `tkt-${sequence}`,
    reference: `${prefix}-${new Date().getFullYear()}-${String(sequence).padStart(5, '0')}`,
    subject: payload.subject.trim(),
    description: payload.description.trim(),
    type: payload.type,
    category: payload.category,
    status: 'new',
    priority: 'normal', // informational; the helpdesk system decides real priority
    createdAt: now,
    updatedAt: now,
    location: payload.location || undefined,
    deviceType: payload.deviceType || undefined,
    operatingSystem: payload.operatingSystem || undefined,
    assetTag: payload.assetTag?.trim() || undefined,
    requesterId: currentUser.id,
    attachments: payload.attachment ? [{ id: `att-${sequence}`, name: payload.attachment.name, fileType: (payload.attachment.name.split('.').pop() ?? 'file').toUpperCase(), size: payload.attachment.size }] : [],
    activity: [{ id: 'a1', kind: 'event', actor: 'system', actorLabel: 'System', message: 'Ticket submitted', createdAt: now }],
    isSample: true,
  }
  store = [ticket, ...store]
  return ticket
}

/** GET /api/helpdesk/categories */
export async function getHelpdeskCategories() {
  await wait()
  return ticketCategoryOptions
}

function matchesArticle(a: KnowledgeBaseArticle, search: string) {
  const content = a.content.map((b) => (b.type === 'list' ? b.items.join(' ') : b.text)).join(' ')
  const haystack = [a.title, a.summary, getKnowledgeBaseCategoryLabel(a.category), ...a.tags, content].join(' ').toLowerCase()
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

/** GET /api/helpdesk/knowledge-base */
export async function getArticles(query: KnowledgeBaseQuery = {}): Promise<KnowledgeBaseArticle[]> {
  await wait()
  return knowledgeBaseArticles
    .filter((a) => (query.search?.trim() ? matchesArticle(a, query.search) : true))
    .filter((a) => (query.category ? a.category === query.category : true))
    .sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || b.updatedAt.localeCompare(a.updatedAt))
}

export async function getFeaturedArticles(limit = 5): Promise<KnowledgeBaseArticle[]> {
  await wait()
  return knowledgeBaseArticles.filter((a) => a.isFeatured).slice(0, limit)
}

/** GET /api/helpdesk/knowledge-base/{id} */
export async function getArticle(id: string): Promise<KnowledgeBaseArticle | null> {
  await wait()
  return knowledgeBaseArticles.find((a) => a.id === id) ?? null
}

/** Articles in the same category, falling back to shared tags. */
export async function getRelatedArticles(article: KnowledgeBaseArticle, limit = 3): Promise<KnowledgeBaseArticle[]> {
  await wait()
  const others = knowledgeBaseArticles.filter((a) => a.id !== article.id)
  const score = (a: KnowledgeBaseArticle) => Number(a.category === article.category) * 10 + a.tags.filter((t) => article.tags.includes(t)).length
  return others
    .filter((a) => score(a) > 0)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit)
}

export async function getSupportContact(): Promise<SupportContact> {
  await wait()
  return supportContact
}


// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getTickets: typeof mockGetTickets = isApiMode ? apiAdapter.getTickets : mockGetTickets
export const getRecentTickets: typeof mockGetRecentTickets = isApiMode ? apiAdapter.getRecentTickets : mockGetRecentTickets
export const getTicket: typeof mockGetTicket = isApiMode ? apiAdapter.getTicket : mockGetTicket
export const createTicket: typeof mockCreateTicket = isApiMode ? apiAdapter.createTicket : mockCreateTicket

/** POST /api/helpdesk/tickets/{id}/replies. Mock mode appends the reply in memory. */
async function mockReplyToTicket(id: string, reply: { message: string; file?: File }): Promise<HelpdeskTicket> {
  await wait()
  const ticket = store.find((t) => t.id === id)
  if (!ticket) throw new Error('Ticket not found')
  const now = nowIso()
  const updated: HelpdeskTicket = {
    ...ticket,
    updatedAt: now,
    activity: [...ticket.activity, { id: `reply-${Date.now()}`, kind: 'reply', actor: 'employee', actorLabel: 'You', message: reply.message.trim(), createdAt: now }],
  }
  store = store.map((t) => (t.id === id ? updated : t))
  return updated
}
export const replyToTicket: typeof mockReplyToTicket = isApiMode ? apiAdapter.replyToTicket : mockReplyToTicket

/** POST /api/helpdesk/tickets/{id}/cancel. */
async function mockCancelTicket(id: string): Promise<HelpdeskTicket> {
  await wait()
  const ticket = store.find((t) => t.id === id)
  if (!ticket) throw new Error('Ticket not found')
  const updated: HelpdeskTicket = { ...ticket, status: 'cancelled', updatedAt: nowIso() }
  store = store.map((t) => (t.id === id ? updated : t))
  return updated
}
export const cancelTicket: typeof mockCancelTicket = isApiMode ? apiAdapter.cancelTicket : mockCancelTicket

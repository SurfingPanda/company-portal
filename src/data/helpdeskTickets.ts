import { currentUser } from '@/data/currentUser'
import type { HelpdeskTicket, TicketActivity, TicketAttachment, TicketCategory, TicketPriority, TicketStatus, TicketType } from '@/types/helpdesk'

/**
 * SAMPLE HELPDESK TICKETS (development only).
 *
 * Fictional tickets for the sample employee. They are not stored in any ticketing system, and the
 * timeline text is generic. Replaced by `GET /api/helpdesk/tickets` (the signed-in employee's own tickets) later.
 * Times are generated relative to "now" so "Updated 2 hours ago" reads naturally in the prototype.
 */

const MIN = 60 * 1000
const HOUR = 60
const DAY = 24 * HOUR

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
const ago = (minutes: number) => Date.now() - minutes * MIN

interface Seed {
  n: number
  type: TicketType
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  subject: string
  description: string
  /** Minutes since created / since last update. */
  created: number
  updated: number
  location?: string
  deviceType?: string
  operatingSystem?: string
  assetTag?: string
  attachments?: TicketAttachment[]
}

function buildActivity(seed: Seed, createdMs: number, updatedMs: number): TicketActivity[] {
  const events: TicketActivity[] = [
    { id: 'a1', kind: 'event', actor: 'system', actorLabel: 'System', message: 'Ticket submitted', createdAt: iso(createdMs) },
  ]
  const at = (offsetMin: number) => iso(Math.min(createdMs + offsetMin * MIN, updatedMs))

  if (seed.status !== 'new') {
    events.push({ id: 'a2', kind: 'event', actor: 'system', actorLabel: 'System', message: 'Ticket assigned to IT Support', createdAt: at(65) })
  }
  if (seed.status === 'pending') {
    events.push({ id: 'a3', kind: 'reply', actor: 'support', actorLabel: 'IT Support', message: 'Could you tell us when this started and whether anything changed beforehand?', createdAt: iso(updatedMs) })
  }
  if (seed.status === 'open') {
    events.push({ id: 'a3', kind: 'event', actor: 'support', actorLabel: 'IT Support', message: 'IT Support is working on this ticket', createdAt: iso(updatedMs) })
  }
  if (seed.status === 'resolved' || seed.status === 'closed') {
    events.push({ id: 'a3', kind: 'reply', actor: 'support', actorLabel: 'IT Support', message: 'This has been resolved. Please let us know if the problem returns.', createdAt: at(180) })
    events.push({ id: 'a4', kind: 'event', actor: 'support', actorLabel: 'IT Support', message: seed.status === 'closed' ? 'Ticket closed' : 'Ticket marked as resolved', createdAt: iso(updatedMs) })
  }
  if (seed.status === 'cancelled') {
    events.push({ id: 'a3', kind: 'event', actor: 'employee', actorLabel: 'You', message: 'Ticket cancelled', createdAt: iso(updatedMs) })
  }
  return events
}

const seeds: Seed[] = [
  { n: 125, type: 'incident', category: 'network', status: 'open', priority: 'normal', subject: 'Unable to connect to office Wi-Fi', description: 'My laptop shows the office network but fails to connect. I have tried forgetting the network and reconnecting.', created: 3 * HOUR, updated: 20, location: 'Office', deviceType: 'Laptop', operatingSystem: 'Windows', attachments: [{ id: 'att-125', name: 'network-error.png', fileType: 'PNG' }] },
  { n: 124, type: 'incident', category: 'email', status: 'pending', priority: 'normal', subject: 'Email not syncing on phone', description: 'New mail arrives on my laptop but not on my phone since yesterday.', created: 1 * DAY + 2 * HOUR, updated: 2 * HOUR, deviceType: 'Mobile phone', operatingSystem: 'Android' },
  { n: 123, type: 'service-request', category: 'hardware', status: 'new', priority: 'low', subject: 'Second monitor for workstation', description: 'I would like a second monitor to help with my work.', created: 45, updated: 45, location: 'Office' },
  { n: 122, type: 'incident', category: 'printer', status: 'resolved', priority: 'normal', subject: 'Printer on floor jams on every job', description: 'The shared printer reports a paper jam even when no paper is stuck.', created: 3 * DAY, updated: 1 * DAY + 3 * HOUR, location: 'Office', deviceType: 'Printer' },
  { n: 121, type: 'access-request', category: 'account', status: 'closed', priority: 'normal', subject: 'Access to shared team folder', description: 'Please grant me access to the shared folder used by my team.', created: 6 * DAY, updated: 4 * DAY },
  { n: 120, type: 'question', category: 'software', status: 'closed', priority: 'low', subject: 'Question about available software', description: 'Is there approved software for editing PDF files?', created: 9 * DAY, updated: 8 * DAY },
  { n: 119, type: 'incident', category: 'account', status: 'open', priority: 'high', subject: 'Cannot sign in after password change', description: 'After changing my password I am asked to sign in repeatedly on one application.', created: 2 * DAY, updated: 5 * HOUR, deviceType: 'Laptop', operatingSystem: 'Windows' },
  { n: 118, type: 'incident', category: 'hardware', status: 'pending', priority: 'high', subject: 'Laptop battery drains quickly', description: 'The battery now lasts about an hour. It used to last the whole morning.', created: 5 * DAY, updated: 1 * DAY, deviceType: 'Laptop', operatingSystem: 'Windows', assetTag: 'SAMPLE-0042' },
  { n: 117, type: 'service-request', category: 'software', status: 'resolved', priority: 'normal', subject: 'Install presentation software', description: 'I need presentation software installed for an upcoming meeting.', created: 7 * DAY, updated: 5 * DAY + 4 * HOUR },
  { n: 116, type: 'incident', category: 'security', status: 'closed', priority: 'urgent', subject: 'Suspicious email received', description: 'I received an email asking me to confirm my account details. I did not click anything.', created: 11 * DAY, updated: 10 * DAY },
  { n: 115, type: 'incident', category: 'network', status: 'cancelled', priority: 'low', subject: 'Slow internet at my desk', description: 'The connection was slow this morning. It seems fine now.', created: 12 * DAY, updated: 12 * DAY - 2 * HOUR },
  { n: 114, type: 'other', category: 'other', status: 'closed', priority: 'low', subject: 'Request for headset', description: 'Could I get a headset for online meetings?', created: 14 * DAY, updated: 11 * DAY },
  { n: 113, type: 'incident', category: 'email', status: 'resolved', priority: 'normal', subject: 'Mailbox full warning', description: 'I keep getting a warning that my mailbox is almost full.', created: 16 * DAY, updated: 14 * DAY },
  { n: 112, type: 'access-request', category: 'security', status: 'closed', priority: 'normal', subject: 'Set up multi-factor sign-in', description: 'I would like help setting up an additional sign-in step.', created: 18 * DAY, updated: 16 * DAY },
  { n: 111, type: 'incident', category: 'printer', status: 'closed', priority: 'low', subject: 'Printer offline from my laptop', description: 'My laptop shows the printer as offline.', created: 21 * DAY, updated: 20 * DAY, deviceType: 'Laptop', operatingSystem: 'macOS' },
  { n: 110, type: 'question', category: 'network', status: 'closed', priority: 'low', subject: 'Wi-Fi password for visitors', description: 'How do visitors connect to the network?', created: 26 * DAY, updated: 25 * DAY },
]

export const mockTickets: HelpdeskTicket[] = seeds.map((seed) => {
  const createdMs = ago(seed.created)
  const updatedMs = ago(seed.updated)
  const prefix = seed.type === 'incident' ? 'INC' : 'REQ'
  return {
    id: `tkt-${seed.n}`,
    reference: `${prefix}-2026-${String(seed.n).padStart(5, '0')}`,
    subject: seed.subject,
    description: seed.description,
    type: seed.type,
    category: seed.category,
    status: seed.status,
    priority: seed.priority,
    createdAt: iso(createdMs),
    updatedAt: iso(updatedMs),
    assignedTo: seed.status === 'new' ? undefined : 'IT Support',
    location: seed.location,
    deviceType: seed.deviceType,
    operatingSystem: seed.operatingSystem,
    assetTag: seed.assetTag,
    requesterId: currentUser.id,
    attachments: seed.attachments ?? [],
    activity: buildActivity(seed, createdMs, updatedMs),
    isSample: true,
  }
})

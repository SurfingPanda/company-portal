import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { FilterOption } from '@/components/admin/AdminFilters'
import { formatDateTime } from '@/lib/format'
import { opts, requestTypeOptions } from '@/pages/admin/crud/crudConfigs'
import type { CrudConfig } from '@/pages/admin/crud/crudTypes'
import { adminApi } from '@/services/admin/adminApi'
import type { AdminRecord } from '@/types/admin'

const s = (r: AdminRecord, k: string) => String(r[k] ?? '')
const when = (r: AdminRecord, k: string) => (r[k] ? formatDateTime(s(r, k)) : '—')
const status = (r: AdminRecord) => <StatusBadge value={s(r, 'status')} />
const publication = opts(['draft', 'published', 'archived'])
const employmentStatusLabels: Record<string, string> = { active: 'Active', on_leave: 'On leave', inactive: 'Inactive' }
const employmentStatusOptions: FilterOption[] = Object.entries(employmentStatusLabels).map(([value, label]) => ({ value, label }))

const departmentOptions = async (): Promise<FilterOption[]> => (await adminApi.list<AdminRecord>('/api/admin/hr/departments', { per_page: 100, sort: 'name', direction: 'asc' })).data.map((d) => ({ value: String(d.id), label: s(d, 'name') }))
const locationOptions = async (): Promise<FilterOption[]> => (await adminApi.list<AdminRecord>('/api/admin/hr/company/locations', { per_page: 100, sort: 'name', direction: 'asc' })).data.map((l) => ({ value: String(l.id), label: s(l, 'name') }))
export const directoryEntryOptions = async (): Promise<FilterOption[]> => (await adminApi.list<AdminRecord>('/api/admin/hr/employees', { per_page: 100, sort: 'display_name', direction: 'asc' })).data.map((e) => ({ value: String(e.id), label: `${s(e, 'display_name')} (${s(e, 'employee_id')})` }))
const publish = (what: string, extra?: (r: AdminRecord) => string): CrudConfig['quickActions'] => [
  { label: 'Publish', field: 'status', value: 'published', from: ['draft', 'archived'] },
  {
    label: 'Unpublish', field: 'status', value: 'draft', from: ['published'],
    confirm: { title: `Unpublish ${what}?`, reversible: true, body: (r) => <p><strong>{s(r, 'name') || s(r, 'title')}</strong> will become a draft and disappear for employees. {extra?.(r)}You can publish it again later.</p> },
  },
  {
    label: 'Archive', field: 'status', value: 'archived', from: ['draft', 'published'],
    confirm: { title: `Archive ${what}?`, reversible: true, body: (r) => <p><strong>{s(r, 'name') || s(r, 'title')}</strong> will be archived and hidden from employees. {extra?.(r)}Nothing is deleted, and it can be published again.</p> },
  },
]

/** Employee directory entries: the employee records, keyed by employee ID and entered by HR. */
export const directoryConfig: CrudConfig = {
  title: 'Employee Directory', singular: 'Directory Entry', description: 'The entries employees see in the Employee Directory. HR enters and maintains these records by hand; hiding an entry never affects the employee account.',
  route: '/admin/hr/employees', api: '/api/admin/hr/employees', defaultSort: 'display_name', noDelete: true,
  extraActions: [{ label: 'Import from CSV', href: '/admin/hr/employees/import' }],
  columns: [
    { key: 'employee_id', header: 'Employee ID', sortKey: 'employee_id', render: (r) => <Link to={`/admin/hr/employees/${r.id}`} className="font-mono text-primary underline-offset-2 hover:underline">{s(r, 'employee_id')}</Link> },
    { key: 'name', header: 'Display name', sortKey: 'display_name', render: (r) => <span className="font-medium">{s(r, 'display_name')}</span> },
    { key: 'job', header: 'Job title', sortKey: 'job_title', render: (r) => s(r, 'job_title') || '—' },
    { key: 'dept', header: 'Department', render: (r) => s(r, 'department') || '—' },
    { key: 'email', header: 'Company email', render: (r) => s(r, 'company_email') || '—' },
    { key: 'loc', header: 'Location', render: (r) => s(r, 'location') || '—' },
    { key: 'emp', header: 'Employment', render: (r) => <StatusBadge value={s(r, 'employment_status') === 'on_leave' ? 'pending' : s(r, 'employment_status') === 'inactive' ? 'inactive' : 'active'} label={employmentStatusLabels[s(r, 'employment_status')] ?? s(r, 'employment_status')} /> },
    { key: 'vis', header: 'Directory', render: (r) => <StatusBadge value={r.is_visible === true ? 'active' : 'inactive'} label={r.is_visible === true ? 'Visible' : 'Hidden'} /> },
  ],
  filters: [
    { key: 'department_id', label: 'Department', options: [], load: departmentOptions },
    { key: 'location_id', label: 'Location', options: [], load: locationOptions },
    { key: 'employment_status', label: 'Employment', options: employmentStatusOptions },
    { key: 'visibility', label: 'Directory', options: [{ value: 'visible', label: 'Visible' }, { value: 'hidden', label: 'Hidden' }] },
    { key: 'account', label: 'Portal account', options: [{ value: 'linked', label: 'Linked' }, { value: 'unlinked', label: 'Not linked' }] },
  ],
  fields: [
    { section: 'Identity', name: 'employee_id', label: 'Employee ID', kind: 'text', required: true, createOnly: true, maxLength: 32, help: 'The company employee ID. Chosen once; it cannot be changed.' },
    { section: 'Identity', name: 'display_name', label: 'Directory display name', kind: 'text', required: true, maxLength: 120, help: 'The name shown to employees. It may differ from the legal name.' },
    { section: 'Job and organisation', name: 'job_title', label: 'Job title', kind: 'text', maxLength: 120, help: 'The employee\'s current position.' },
    { section: 'Job and organisation', name: 'department_id', label: 'Department', kind: 'select', options: [] },
    { section: 'Login and portal access', wide: true, name: 'company_email', label: 'Company email (login)', kind: 'email', required: true, maxLength: 255, help: 'Also the sign-in name for this employee. Saving a new entry creates their login and emails them a link to choose their own password. Never a personal email.' },
    { section: 'Job and organisation', name: 'location_id', label: 'Work location', kind: 'select', options: [] },
    { section: 'Login and portal access', name: 'role', label: 'Portal role', kind: 'select', required: true, options: [{ value: 'employee', label: 'Regular Employee' }, { value: 'manager', label: 'Manager' }], help: 'What this person can do in the portal. HR Staff, IT Staff and Administrator access is granted by an administrator under Users.' },
    { section: 'Employment', name: 'employment_status', label: 'Employment status', kind: 'select', required: true, options: employmentStatusOptions, help: 'Inactive disables the login at once and signs them out everywhere. Setting them Active again restores it. Shown to employees in the directory status filter.' },
    { section: 'Employment', name: 'employment_type', label: 'Employment type', kind: 'select', options: opts(['regular', 'probationary', 'contractual', 'part_time']).map((o) => ({ ...o, label: o.label.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) })) },
    { section: 'Employment', name: 'date_joined', label: 'Date joined', kind: 'date', help: 'The first day of employment. Cannot be in the future.' },
    { section: 'Job and organisation', name: 'manager_id', label: 'Manager', kind: 'select', options: [], help: 'Who this employee reports to. Requests from this employee go to this manager first (then up the reporting line). Approval Routing holds only the exceptions.' },
    { section: 'Directory listing', name: 'phone', label: 'Business phone / extension', kind: 'text', maxLength: 40 },
    { section: 'Directory listing', name: 'description', label: 'Directory description', kind: 'textarea', maxLength: 1000, rows: 3, help: 'Short, approved description only. No private or HR-confidential information.' },
    { section: 'Directory listing', name: 'is_visible', label: 'Show in the Employee Directory', kind: 'checkbox', help: 'Hiding an entry never changes the employee\'s portal account or access.' },
  ],
  sectionHints: {
    Identity: 'Who this record belongs to. The employee ID is chosen once and cannot be changed later.',
    'Job and organisation': 'Where this person sits in the company. The manager decides who approves their requests first.',
    'Login and portal access': 'Saving a new entry creates the login and emails a link so the employee sets their own password.',
    Employment: 'Inactive switches the login off at once and signs the person out everywhere; Active restores it.',
    'Directory listing': 'What colleagues see in the Employee Directory. Keep it short and approved: no private or HR-confidential details.',
  },
  initial: { employee_id: '', display_name: '', job_title: '', department_id: '', company_email: '', role: 'employee', location_id: '', employment_status: 'active', employment_type: '', date_joined: '', manager_id: '', phone: '', description: '', is_visible: false },
  quickActions: [
    { label: 'Show', field: 'is_visible', value: 'true', from: ['false'] },
    { label: 'Hide', field: 'is_visible', value: 'false', from: ['true'], confirm: { title: 'Hide from the directory?', reversible: true, body: (r) => <p><strong>{s(r, 'display_name')}</strong> will no longer appear in the Employee Directory, search or department lists. Their portal account and access are not affected. You can show the entry again at any time.</p> } },
  ],
  dynamicOptions: { department_id: departmentOptions, location_id: locationOptions, manager_id: directoryEntryOptions },
  lockReason: (r, name) => {
    if (name !== 'role') return undefined
    const account = (r.account ?? {}) as { linked?: boolean }
    if (!account.linked) return 'Set when the login is created. New logins start as Regular Employee.'
    return r.role_locked === true ? 'This person has HR, IT or Administrator access. An administrator changes it under Users.' : undefined
  },
  label: (r) => `${s(r, 'employee_id')} ${s(r, 'display_name')}`,
}

export const departmentsConfig: CrudConfig = {
  title: 'Departments', singular: 'Department', description: 'Department names and descriptions shown in the directory filters and on the company pages. Employees are assigned to a department on their employee record.',
  route: '/admin/hr/departments', api: '/api/admin/hr/departments', defaultSort: 'sort_order',
  columns: [
    { key: 'name', header: 'Name', sortKey: 'name', render: (r) => <span className="font-medium">{s(r, 'name')}</span> },
    { key: 'code', header: 'Code', render: (r) => s(r, 'code') || '—' },
    { key: 'head', header: 'Head', render: (r) => s(r, 'head') || '—' },
    { key: 'order', header: 'Order', sortKey: 'sort_order', render: (r) => s(r, 'sort_order') },
    { key: 'entries', header: 'Directory entries', render: (r) => s(r, 'entries_count') },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => status(r) },
  ],
  filters: [{ key: 'status', label: 'Status', options: publication }],
  fields: [
    { name: 'name', label: 'Department name', kind: 'text', required: true, maxLength: 120 },
    { name: 'code', label: 'Department code', kind: 'text', maxLength: 20 },
    { name: 'description', label: 'Description', kind: 'textarea', maxLength: 2000, rows: 4 },
    { name: 'contact_email', label: 'Department contact email', kind: 'email', maxLength: 255, help: 'Only if approved for display.' },
    { name: 'head_directory_entry_id', label: 'Department head (from the directory)', kind: 'select', options: [], help: 'Pick a directory entry. This name is shown on the company page, and the head reviews requests from people in this department who have no manager that can act, unless an approval route says otherwise (Approval Routing).' },
    { name: 'head_display', label: 'Department head (typed name)', kind: 'text', maxLength: 120, help: 'Used only when no directory entry is chosen.' },
    { name: 'sort_order', label: 'Display order', kind: 'number', help: 'Lower numbers appear first.' },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: publication },
  ],
  initial: { name: '', code: '', description: '', contact_email: '', head_directory_entry_id: '', head_display: '', sort_order: '0', status: 'draft' },
  dynamicOptions: { head_directory_entry_id: directoryEntryOptions },
  quickActions: publish('department', (r) => (Number(r.entries_count) > 0 ? `${s(r, 'entries_count')} directory ${Number(r.entries_count) === 1 ? 'entry still refers' : 'entries still refer'} to it; they are kept and keep their reference. ` : '')),
  label: (r) => s(r, 'name'),
}

export const locationsConfig: CrudConfig = {
  title: 'Company Locations', singular: 'Location', description: 'Locations shown on the company pages and the directory. Enter only approved addresses and contact details.',
  route: '/admin/hr/company/locations', api: '/api/admin/hr/company/locations', defaultSort: 'sort_order',
  columns: [
    { key: 'name', header: 'Name', sortKey: 'name', render: (r) => <span className="font-medium">{s(r, 'name')}</span> },
    { key: 'address', header: 'Address', render: (r) => <span className="line-clamp-2 max-w-xs">{s(r, 'address') || '—'}</span> },
    { key: 'order', header: 'Order', sortKey: 'sort_order', render: (r) => s(r, 'sort_order') },
    { key: 'entries', header: 'Directory entries', render: (r) => s(r, 'entries_count') },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => status(r) },
  ],
  filters: [{ key: 'status', label: 'Status', options: publication }],
  fields: [
    { name: 'name', label: 'Location name', kind: 'text', required: true, maxLength: 160 },
    { name: 'address', label: 'Approved address', kind: 'textarea', maxLength: 1000, rows: 3 },
    { name: 'phone', label: 'General phone', kind: 'text', maxLength: 40 },
    { name: 'email', label: 'General email', kind: 'email', maxLength: 255 },
    { name: 'description', label: 'Description', kind: 'textarea', maxLength: 2000, rows: 3 },
    { name: 'operating_info', label: 'Operating information', kind: 'text', maxLength: 255, help: 'For example business hours, as supplied by HR.' },
    { name: 'sort_order', label: 'Display order', kind: 'number' },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: publication, help: 'Publishing or archiving needs the company publish permission.' },
  ],
  initial: { name: '', address: '', phone: '', email: '', description: '', operating_info: '', sort_order: '0', status: 'draft' },
  quickActions: publish('location'),
  label: (r) => s(r, 'name'),
}

export const historyConfig: CrudConfig = {
  title: 'Company History', singular: 'Milestone', description: 'Timeline entries on the company history page. Add only approved milestones and dates; drafts stay hidden from employees.',
  route: '/admin/hr/company/history', api: '/api/admin/hr/company/history', defaultSort: 'sort_order',
  columns: [
    { key: 'year', header: 'Year', sortKey: 'year', render: (r) => s(r, 'year') || '—' },
    { key: 'title', header: 'Title', sortKey: 'title', render: (r) => <span className="font-medium">{s(r, 'title')}</span> },
    { key: 'order', header: 'Order', sortKey: 'sort_order', render: (r) => s(r, 'sort_order') },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => status(r) },
    { key: 'updated', header: 'Updated', render: (r) => when(r, 'updated_at') },
  ],
  filters: [{ key: 'status', label: 'Status', options: publication }],
  fields: [
    { name: 'title', label: 'Title', kind: 'text', required: true, maxLength: 255 },
    { name: 'year', label: 'Year or date', kind: 'text', maxLength: 10, help: 'YYYY, YYYY-MM or YYYY-MM-DD. Leave empty until confirmed.' },
    { name: 'description', label: 'Description', kind: 'textarea', maxLength: 3000, rows: 5 },
    { name: 'sort_order', label: 'Display order', kind: 'number' },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: publication },
  ],
  initial: { title: '', year: '', description: '', sort_order: '0', status: 'draft' },
  quickActions: publish('milestone'),
  label: (r) => s(r, 'title'),
}

export const leadershipConfig: CrudConfig = {
  title: 'Leadership', singular: 'Leadership Profile', description: 'Approved leadership profiles. Photos cannot be uploaded yet (no secure image storage); profiles show without one.',
  route: '/admin/hr/company/leadership', api: '/api/admin/hr/company/leadership', defaultSort: 'sort_order',
  columns: [
    { key: 'name', header: 'Name', sortKey: 'name', render: (r) => <span className="font-medium">{s(r, 'name')}</span> },
    { key: 'title', header: 'Title', render: (r) => s(r, 'title') },
    { key: 'area', header: 'Area', render: (r) => s(r, 'area') || '—' },
    { key: 'order', header: 'Order', sortKey: 'sort_order', render: (r) => s(r, 'sort_order') },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => status(r) },
  ],
  filters: [{ key: 'status', label: 'Status', options: publication }],
  fields: [
    { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 160, help: 'Approved name only. Do not enter people who have not been confirmed.' },
    { name: 'title', label: 'Official title', kind: 'text', required: true, maxLength: 160 },
    { name: 'area', label: 'Department or area', kind: 'text', maxLength: 120 },
    { name: 'biography', label: 'Short biography', kind: 'textarea', maxLength: 3000, rows: 5, help: 'Plain text, approved wording only.' },
    { name: 'sort_order', label: 'Display order', kind: 'number' },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: publication },
  ],
  initial: { name: '', title: '', area: '', biography: '', sort_order: '0', status: 'draft' },
  quickActions: publish('profile'),
  label: (r) => s(r, 'name'),
}

export const approvalRoutesConfig: CrudConfig = {
  title: 'Approval Routing', singular: 'Route', description: 'Exceptions to the normal rule. Normally a request goes to the employee\'s manager (set on their employee record), then up the reporting line to the first manager who can act, then the department head, then the company fallback. A route here overrides that for a whole department, or for one request type. The approver must have a linked portal account and the manager role (assigned under Users); routing never grants access by itself.',
  route: '/admin/hr/approvals', api: '/api/admin/hr/approval-routes', defaultSort: 'updated_at',
  columns: [
    { key: 'dept', header: 'Department', render: (r) => <span className="font-medium">{s(r, 'department')}</span> },
    { key: 'type', header: 'Request type', render: (r) => s(r, 'request_type') },
    { key: 'approver', header: 'Approver', render: (r) => `${s(r, 'approver')} (${s(r, 'approver_employee_id')})` },
    { key: 'can', header: 'Can review', render: (r) => (r.can_act === true ? <StatusBadge value="active" label="Yes" /> : <StatusBadge value="pending" label="No: needs the manager role" />) },
    { key: 'active', header: 'Status', render: (r) => <StatusBadge value={r.is_active === true ? 'active' : 'inactive'} /> },
  ],
  filters: [{ key: 'department_id', label: 'Department', options: [], load: departmentOptions }, { key: 'is_active', label: 'Status', options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] }],
  fields: [
    { name: 'department_id', label: 'Department', kind: 'select', required: true, options: [], help: 'Requests filed by people in this department (by their directory entry).' },
    { name: 'request_type_id', label: 'Request type', kind: 'select', options: [], help: 'Leave empty to route every request type. A route for one type takes priority over the general route.' },
    { name: 'approver_directory_entry_id', label: 'Approver', kind: 'select', required: true, options: [], help: 'Must be linked to a portal account (see the directory entry). They cannot approve their own requests.' },
    { name: 'is_active', label: 'Route is active', kind: 'checkbox' },
  ],
  initial: { department_id: '', request_type_id: '', approver_directory_entry_id: '', is_active: true },
  quickActions: [
    { label: 'Activate', field: 'is_active', value: 'true', from: ['false'] },
    { label: 'Deactivate', field: 'is_active', value: 'false', from: ['true'], confirm: { title: 'Deactivate this route?', reversible: true, body: (r) => <p>Requests from <strong>{s(r, 'department')}</strong> will no longer be routed to <strong>{s(r, 'approver')}</strong> by this rule (the department head, if any, applies instead). You can activate it again.</p> } },
  ],
  dynamicOptions: { department_id: departmentOptions, request_type_id: requestTypeOptions, approver_directory_entry_id: directoryEntryOptions },
  label: (r) => `${s(r, 'department')} → ${s(r, 'approver')}`,
}

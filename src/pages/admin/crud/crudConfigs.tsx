import { StatusBadge } from '@/components/admin/StatusBadge'
import type { FilterOption } from '@/components/admin/AdminFilters'
import type { AdminRecord } from '@/types/admin'
import type { CrudConfig } from '@/pages/admin/crud/crudTypes'
import { adminApi } from '@/services/admin/adminApi'
import { formatDateTime } from '@/lib/format'

export const opts = (values: string[]): FilterOption[] => values.map((value) => ({ value, label: ['hr', 'it'].includes(value) ? value.toUpperCase() : value.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) }))
const text = (record: AdminRecord, key: string) => String(record[key] ?? '')
const when = (record: AdminRecord, key: string) => (record[key] ? formatDateTime(String(record[key])) : '—')
const status = (record: AdminRecord, key = 'status') => <StatusBadge value={text(record, key)} />
const yes = (value: unknown) => (value === true ? 'Yes' : 'No')

const contentStatus = opts(['draft', 'published', 'archived'])
const announcementCategories = opts(['company-news', 'hr', 'it', 'operations', 'facilities', 'finance', 'training', 'safety', 'policy', 'other'])
const eventCategories = opts(['company-event', 'training', 'meeting', 'holiday', 'deadline', 'employee-activity', 'department-event', 'other'])
const requestCategories = opts(['hr', 'benefits', 'recruitment', 'it', 'administration', 'other'])
const formCategories = opts(['hr', 'recruitment', 'it', 'administration', 'other'])

/** Dynamic option lists loaded from Laravel (so a form can only point at records that exist). */
export const documentOptions = async (): Promise<FilterOption[]> => (await adminApi.list<AdminRecord>('/api/admin/documents', { per_page: 100, sort: 'title', direction: 'asc' })).data.map((d) => ({ value: String(d.id), label: text(d, 'title') }))
const categoryOptions = async (): Promise<FilterOption[]> => (await adminApi.get<AdminRecord[]>('/api/admin/document-categories')).map((c) => ({ value: String(c.id), label: text(c, 'name') }))
export const requestTypeOptions = async (): Promise<FilterOption[]> => (await adminApi.list<AdminRecord>('/api/admin/request-types', { per_page: 100, sort: 'name', direction: 'asc' })).data.map((t) => ({ value: String(t.id), label: text(t, 'name') }))
export const formOptions = async (): Promise<FilterOption[]> => (await adminApi.list<AdminRecord>('/api/admin/forms', { per_page: 100, sort: 'title', direction: 'asc' })).data.map((f) => ({ value: String(f.id), label: text(f, 'title') }))
export const benefitOptions = async (): Promise<FilterOption[]> => (await adminApi.list<AdminRecord>('/api/admin/benefits', { per_page: 100, sort: 'name', direction: 'asc' })).data.map((b) => ({ value: String(b.id), label: text(b, 'name') }))

/** Publish / unpublish / archive for content that has the draft-published-archived lifecycle. */
const lifecycle = (what: string, hides: string): CrudConfig['quickActions'] => [
  { label: 'Publish', field: 'status', value: 'published', from: ['draft', 'archived'] },
  {
    label: 'Unpublish', field: 'status', value: 'draft', from: ['published'],
    confirm: { title: `Unpublish ${what}?`, reversible: true, body: (r) => <p><strong>{text(r, 'title') || text(r, 'name')}</strong> will become a draft and disappear for employees{hides}. You can publish it again later.</p> },
  },
  {
    label: 'Archive', field: 'status', value: 'archived', from: ['published', 'draft'],
    confirm: { title: `Archive ${what}?`, reversible: true, body: (r) => <p><strong>{text(r, 'title') || text(r, 'name')}</strong> will be archived and hidden from employees{hides}. It stays in the system and can be published again.</p> },
  },
]

export const announcementsConfig: CrudConfig = {
  title: 'Announcements', singular: 'Announcement', description: 'Company announcements shown to employees. Drafts are visible only here.',
  route: '/admin/announcements', api: '/api/announcements', defaultSort: 'published_at',
  columns: [
    { key: 'title', header: 'Title', sortKey: 'title', render: (r) => <span className="font-medium">{text(r, 'title')}</span> },
    { key: 'category', header: 'Category', render: (r) => text(r, 'category').replace(/-/g, ' ') },
    { key: 'priority', header: 'Priority', sortKey: 'priority', render: (r) => text(r, 'priority') },
    { key: 'status', header: 'Status', render: (r) => status(r) },
    { key: 'pinned', header: 'Pinned', render: (r) => yes(r.is_pinned) },
    { key: 'published_at', header: 'Published', sortKey: 'published_at', render: (r) => when(r, 'published_at') },
  ],
  filters: [{ key: 'status', label: 'Status', options: contentStatus }, { key: 'category', label: 'Category', options: announcementCategories }, { key: 'priority', label: 'Priority', options: opts(['normal', 'important', 'urgent']) }],
  fields: [
    { name: 'title', label: 'Title', kind: 'text', required: true, maxLength: 255 },
    { name: 'summary', label: 'Summary', kind: 'textarea', required: true, maxLength: 500, rows: 2 },
    { name: 'content', label: 'Content', kind: 'textarea', required: true, rows: 10, help: 'Plain text. Separate paragraphs with a blank line; start a line with "## " for a heading or "- " for list items. HTML is not rendered.' },
    { name: 'category', label: 'Category', kind: 'select', required: true, options: announcementCategories },
    { name: 'priority', label: 'Priority', kind: 'select', required: true, options: opts(['normal', 'important', 'urgent']) },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: contentStatus, help: 'Employees see only published announcements inside their publish and expiry dates.' },
    { name: 'is_pinned', label: 'Pin to the top', kind: 'checkbox' },
    { name: 'published_at', label: 'Publish date', kind: 'datetime', help: 'Leave empty to publish immediately when the status is Published.' },
    { name: 'expires_at', label: 'Expiry date', kind: 'datetime' },
  ],
  initial: { title: '', summary: '', content: '', category: 'company-news', priority: 'normal', status: 'draft', is_pinned: false, published_at: '', expires_at: '' },
  quickActions: lifecycle('announcement', ''),
  label: (r) => text(r, 'title'),
}

export const calendarConfig: CrudConfig = {
  title: 'Calendar', singular: 'Event', description: 'Company events, holidays and deadlines shown on the employee calendar.',
  route: '/admin/calendar', api: '/api/calendar/events', defaultSort: 'starts_at',
  columns: [
    { key: 'title', header: 'Event', sortKey: 'title', render: (r) => <span className="font-medium">{text(r, 'title')}</span> },
    { key: 'category', header: 'Category', render: (r) => text(r, 'category').replace(/-/g, ' ') },
    { key: 'status', header: 'Status', render: (r) => status(r) },
    { key: 'visibility', header: 'Visibility', render: (r) => text(r, 'visibility') },
    { key: 'starts_at', header: 'Starts', sortKey: 'starts_at', render: (r) => when(r, 'starts_at') },
  ],
  filters: [{ key: 'status', label: 'Status', options: opts(['scheduled', 'cancelled', 'postponed', 'completed']) }, { key: 'category', label: 'Category', options: eventCategories }],
  fields: [
    { name: 'title', label: 'Title', kind: 'text', required: true, maxLength: 255 },
    { name: 'description', label: 'Description', kind: 'textarea', maxLength: 5000 },
    { name: 'category', label: 'Category', kind: 'select', required: true, options: eventCategories },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: opts(['scheduled', 'cancelled', 'postponed', 'completed']) },
    { name: 'visibility', label: 'Visibility', kind: 'select', required: true, options: opts(['all', 'department', 'private']), help: 'Only "all" events are shown to ordinary employees today; department and private events need department data that is not available yet.' },
    { name: 'location', label: 'Location', kind: 'text', maxLength: 255 },
    { name: 'starts_at', label: 'Starts', kind: 'datetime', required: true },
    { name: 'ends_at', label: 'Ends', kind: 'datetime' },
    { name: 'is_all_day', label: 'All-day event', kind: 'checkbox' },
  ],
  initial: { title: '', description: '', category: 'company-event', status: 'scheduled', visibility: 'all', location: '', starts_at: '', ends_at: '', is_all_day: false },
  quickActions: [
    { label: 'Postpone', field: 'status', value: 'postponed', from: ['scheduled'] },
    { label: 'Complete', field: 'status', value: 'completed', from: ['scheduled', 'postponed'] },
    { label: 'Cancel', field: 'status', value: 'cancelled', from: ['scheduled', 'postponed'], confirm: { title: 'Cancel event?', reversible: true, body: (r) => <p><strong>{text(r, 'title')}</strong> will be marked cancelled on the employee calendar. You can set it back to scheduled by editing it.</p> } },
  ],
  label: (r) => text(r, 'title'),
}

export const documentsConfig: CrudConfig = {
  title: 'Documents', singular: 'Document', description: 'Document records: title, category, owner, version and who may open them. Files are not stored yet, so this manages metadata only.',
  route: '/admin/documents', api: '/api/admin/documents', defaultSort: 'updated_at',
  columns: [
    { key: 'title', header: 'Title', sortKey: 'title', render: (r) => <span className="font-medium">{text(r, 'title')}</span> },
    { key: 'file_type', header: 'Type', render: (r) => text(r, 'file_type') || '—' },
    { key: 'access_level', header: 'Access', render: (r) => text(r, 'access_level') },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => status(r) },
    { key: 'updated_at', header: 'Updated', sortKey: 'updated_at', render: (r) => when(r, 'updated_at') },
  ],
  filters: [{ key: 'status', label: 'Status', options: contentStatus }, { key: 'access_level', label: 'Access', options: opts(['all', 'department', 'manager', 'restricted']) }],
  fields: [
    { name: 'title', label: 'Title', kind: 'text', required: true, maxLength: 255 },
    { name: 'description', label: 'Description', kind: 'textarea', maxLength: 2000, rows: 3 },
    { name: 'document_category_id', label: 'Category', kind: 'select', required: true, options: [] },
    { name: 'department', label: 'Owning department', kind: 'text', maxLength: 80, help: 'Free text label. Used by the "department" access level to match the employee\'s department.' },
    { name: 'file_type', label: 'File type', kind: 'select', options: opts(['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX']).map((o) => ({ value: o.value.toUpperCase(), label: o.value.toUpperCase() })) },
    { name: 'version', label: 'Version', kind: 'text', maxLength: 20 },
    { name: 'owner', label: 'Owner', kind: 'text', maxLength: 255, help: 'A department or office, not a person.' },
    { name: 'access_level', label: 'Who can open it', kind: 'select', required: true, options: opts(['all', 'department', 'manager', 'restricted']), help: 'all: every employee. department: same department as the employee record. manager: managers and administrators. restricted: document managers only.' },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: contentStatus },
  ],
  initial: { title: '', description: '', document_category_id: '', department: '', file_type: 'PDF', version: '', owner: '', access_level: 'all', status: 'draft' },
  quickActions: lifecycle('document', ''),
  dynamicOptions: { document_category_id: categoryOptions },
  label: (r) => text(r, 'title'),
}

export const formsConfig: CrudConfig = {
  title: 'Forms', singular: 'Form', description: 'The forms catalogue. A form points at a downloadable document or at a request type; it never copies their content.',
  route: '/admin/forms', api: '/api/admin/forms', defaultSort: 'updated_at',
  columns: [
    { key: 'title', header: 'Title', sortKey: 'title', render: (r) => <span className="font-medium">{text(r, 'title')}</span> },
    { key: 'category', header: 'Category', render: (r) => text(r, 'category') },
    { key: 'form_type', header: 'Type', render: (r) => text(r, 'form_type') },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => status(r) },
  ],
  filters: [{ key: 'status', label: 'Status', options: contentStatus }, { key: 'category', label: 'Category', options: formCategories }],
  fields: [
    { name: 'title', label: 'Title', kind: 'text', required: true, maxLength: 255 },
    { name: 'description', label: 'Description', kind: 'textarea', maxLength: 2000, rows: 3 },
    { name: 'category', label: 'Category', kind: 'select', required: true, options: formCategories },
    { name: 'form_type', label: 'Type', kind: 'select', required: true, options: opts(['download', 'online']), help: 'download: links a document. online: starts the request type below.' },
    { name: 'document_id', label: 'Linked document', kind: 'select', options: [] },
    { name: 'request_type_id', label: 'Request type to start', kind: 'select', options: [] },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: contentStatus, help: 'Published forms are active; draft or archived forms are hidden from employees.' },
    { name: 'instructions', label: 'Instructions', kind: 'textarea', maxLength: 2000, rows: 3 },
  ],
  initial: { title: '', description: '', category: 'hr', form_type: 'download', document_id: '', request_type_id: '', status: 'draft', instructions: '' },
  quickActions: [
    { label: 'Activate', field: 'status', value: 'published', from: ['draft', 'archived'] },
    { label: 'Deactivate', field: 'status', value: 'draft', from: ['published'], confirm: { title: 'Deactivate form?', reversible: true, body: (r) => <p><strong>{text(r, 'title')}</strong> will be hidden from employees until it is activated again.</p> } },
  ],
  dynamicOptions: { document_id: documentOptions, request_type_id: requestTypeOptions },
  label: (r) => text(r, 'title'),
}

export const requestTypesConfig: CrudConfig = {
  title: 'Request Types', singular: 'Request Type', description: 'The kinds of request employees can submit and the fields each one asks for. Request types are deactivated, never deleted, because requests refer to them.',
  route: '/admin/request-types', api: '/api/admin/request-types', defaultSort: 'name', noDelete: true,
  columns: [
    { key: 'name', header: 'Name', sortKey: 'name', render: (r) => <span className="font-medium">{text(r, 'name')}</span> },
    { key: 'request_code', header: 'Code', render: (r) => <code className="text-xs">{text(r, 'request_code')}</code> },
    { key: 'category', header: 'Category', sortKey: 'category', render: (r) => text(r, 'category') },
    { key: 'is_active', header: 'Availability', render: (r) => <StatusBadge value={r.is_active === true ? 'active' : 'inactive'} /> },
  ],
  filters: [{ key: 'category', label: 'Category', options: requestCategories }, { key: 'is_active', label: 'Availability', options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] }],
  fields: [
    { name: 'request_code', label: 'Code', kind: 'text', required: true, createOnly: true, maxLength: 40, help: 'Lower-case letters, numbers and hyphens, e.g. rt-travel. Cannot be changed later.' },
    { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 255 },
    { name: 'description', label: 'Description', kind: 'textarea', maxLength: 2000, rows: 3 },
    { name: 'category', label: 'Category', kind: 'select', required: true, options: requestCategories },
    { name: 'reference_prefix', label: 'Reference prefix', kind: 'text', maxLength: 8, help: '2 to 8 capital letters, e.g. LV gives LV-2026-0001. Empty uses REQ.' },
    { name: 'requires_attachment', label: 'Requires an attachment', kind: 'checkbox' },
    { name: 'requires_approval', label: 'Requires approval', kind: 'checkbox' },
    { name: 'is_active', label: 'Available to employees', kind: 'checkbox' },
    { name: 'fields', label: 'Form fields (JSON)', kind: 'json', required: true, help: 'A list of fields: id, label, type (text, textarea, select, date, time, number, file, checkbox, email), required, options (for select), min (for number).' },
  ],
  initial: { request_code: '', name: '', description: '', category: 'hr', reference_prefix: '', requires_attachment: false, requires_approval: false, is_active: true, fields: '[\n  { "id": "details", "label": "Details", "type": "textarea", "required": true }\n]' },
  quickActions: [
    { label: 'Activate', field: 'is_active', value: 'true', from: ['false'] },
    { label: 'Deactivate', field: 'is_active', value: 'false', from: ['true'], confirm: { title: 'Deactivate request type?', reversible: true, body: (r) => <p>Employees will no longer be able to start <strong>{text(r, 'name')}</strong>. Existing requests are not affected, and you can activate it again.</p> } },
  ],
  toForm: (r) => ({
    request_code: text(r, 'request_code'), name: text(r, 'name'), description: text(r, 'description'), category: text(r, 'category'), reference_prefix: text(r, 'reference_prefix'),
    requires_attachment: r.requires_attachment === true, requires_approval: r.requires_approval === true, is_active: r.is_active === true, fields: JSON.stringify(r.fields ?? [], null, 2),
  }),
  toBody: (values, mode) => {
    let fields: unknown
    try {
      fields = JSON.parse(String(values.fields))
      if (!Array.isArray(fields)) throw new Error('not a list')
    } catch {
      throw Object.assign(new Error('Enter a valid JSON list of fields.'), { field: 'fields' })
    }
    const body: Record<string, unknown> = {
      name: values.name, description: values.description || null, category: values.category, reference_prefix: values.reference_prefix || null,
      requires_attachment: values.requires_attachment === true, requires_approval: values.requires_approval === true, is_active: values.is_active === true, fields,
    }
    if (mode === 'create') body.request_code = values.request_code
    return body
  },
  label: (r) => text(r, 'name'),
}

export const benefitsConfig: CrudConfig = {
  title: 'Benefits', singular: 'Benefit', description: 'Benefit INFORMATION published by HR. Amounts, eligibility results, claims and balances are handled by HR and are not stored here.',
  route: '/admin/benefits', api: '/api/admin/benefits', defaultSort: 'name',
  columns: [
    { key: 'name', header: 'Name', sortKey: 'name', render: (r) => <span className="font-medium">{text(r, 'name')}</span> },
    { key: 'category', header: 'Category', sortKey: 'category', render: (r) => text(r, 'category') },
    { key: 'status', header: 'Status', render: (r) => status(r) },
    { key: 'featured', header: 'Featured', render: (r) => yes(r.is_featured) },
  ],
  filters: [{ key: 'status', label: 'Status', options: opts(['available', 'information-only', 'coming-soon']) }],
  fields: [
    { name: 'name', label: 'Name', kind: 'text', required: true, maxLength: 255 },
    { name: 'short_description', label: 'Short description', kind: 'text', required: true, maxLength: 255 },
    { name: 'description', label: 'Description', kind: 'textarea', required: true, maxLength: 5000, rows: 6 },
    { name: 'eligibility', label: 'Eligibility wording', kind: 'textarea', maxLength: 2000, rows: 3, help: 'HR-approved text only. The portal never calculates eligibility.' },
    { name: 'category', label: 'Category', kind: 'select', required: true, options: opts(['health', 'insurance', 'government', 'assistance', 'leave', 'programs', 'other']) },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: opts(['available', 'information-only', 'coming-soon']) },
    { name: 'is_featured', label: 'Featured', kind: 'checkbox' },
  ],
  initial: { name: '', short_description: '', description: '', eligibility: '', category: 'other', status: 'information-only', is_featured: false },
  label: (r) => text(r, 'name'),
}

export const resourcesConfig: CrudConfig = {
  title: 'Resources', singular: 'Resource', description: 'Resource Center entries. Each points at a document, form, benefit, service or page; none copies its content.',
  route: '/admin/resources', api: '/api/admin/resources', defaultSort: 'updated_at',
  columns: [
    { key: 'title', header: 'Title', sortKey: 'title', render: (r) => <span className="font-medium">{text(r, 'title')}</span> },
    { key: 'category', header: 'Category', sortKey: 'category', render: (r) => text(r, 'category') },
    { key: 'resource_type', header: 'Type', render: (r) => text(r, 'resource_type') },
    { key: 'status', header: 'Status', render: (r) => status(r) },
    { key: 'featured', header: 'Featured', render: (r) => yes(r.is_featured) },
  ],
  filters: [{ key: 'status', label: 'Status', options: contentStatus }, { key: 'resource_type', label: 'Type', options: opts(['document', 'form', 'service', 'page', 'faq', 'external']) }],
  fields: [
    { name: 'title', label: 'Title', kind: 'text', required: true, maxLength: 255 },
    { name: 'description', label: 'Description', kind: 'textarea', maxLength: 2000, rows: 3 },
    { name: 'category', label: 'Category', kind: 'select', required: true, options: opts(['hr', 'it', 'company', 'policies', 'forms', 'benefits', 'support', 'faq']) },
    { name: 'resource_type', label: 'Type', kind: 'select', required: true, options: opts(['document', 'form', 'service', 'page', 'faq', 'external']) },
    { name: 'target_url', label: 'Destination', kind: 'text', maxLength: 500, help: 'A portal path such as /resources/hr, or an https:// address. Other schemes are rejected.' },
    { name: 'document_id', label: 'Linked document', kind: 'select', options: [] },
    { name: 'form_id', label: 'Linked form', kind: 'select', options: [] },
    { name: 'benefit_id', label: 'Linked benefit', kind: 'select', options: [] },
    { name: 'service_key', label: 'Service key', kind: 'text', maxLength: 60 },
    { name: 'is_featured', label: 'Featured', kind: 'checkbox' },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: contentStatus },
  ],
  initial: { title: '', description: '', category: 'company', resource_type: 'page', target_url: '', document_id: '', form_id: '', benefit_id: '', service_key: '', is_featured: false, status: 'draft' },
  quickActions: lifecycle('resource', ''),
  dynamicOptions: { document_id: documentOptions, form_id: formOptions, benefit_id: benefitOptions },
  label: (r) => text(r, 'title'),
}

export const jobsConfig: CrudConfig = {
  title: 'Job Postings', singular: 'Job Posting', description: 'Internal job postings. Applications and referrals are listed under Operations; there is no scoring or recruiter workflow.',
  route: '/admin/recruitment/jobs', api: '/api/admin/recruitment/jobs', defaultSort: 'updated_at',
  columns: [
    { key: 'title', header: 'Position', sortKey: 'title', render: (r) => <span className="font-medium">{text(r, 'title')}</span> },
    { key: 'department', header: 'Department', render: (r) => text(r, 'department') },
    { key: 'status', header: 'Status', sortKey: 'status', render: (r) => status(r) },
    { key: 'applications', header: 'Applications', render: (r) => text(r, 'applications_count') },
    { key: 'published_at', header: 'Published', sortKey: 'published_at', render: (r) => when(r, 'published_at') },
  ],
  filters: [{ key: 'status', label: 'Status', options: opts(['open', 'closing-soon', 'closed', 'filled']) }],
  fields: [
    { name: 'title', label: 'Position title', kind: 'text', required: true, maxLength: 255, section: 'Position', wide: true },
    { name: 'department', label: 'Department', kind: 'text', required: true, maxLength: 80, section: 'Position' },
    { name: 'location', label: 'Location', kind: 'text', required: true, maxLength: 255, section: 'Position' },
    { name: 'employment_type', label: 'Employment type', kind: 'select', required: true, options: opts(['full-time', 'part-time', 'contract', 'internship']), section: 'Position' },
    { name: 'work_arrangement', label: 'Work arrangement', kind: 'select', options: opts(['on-site', 'hybrid', 'remote']), section: 'Position' },
    { name: 'summary', label: 'Summary', kind: 'textarea', maxLength: 1000, rows: 2, section: 'Job details', help: 'One or two sentences shown on the careers list.' },
    { name: 'description', label: 'Description', kind: 'textarea', required: true, maxLength: 10000, rows: 8, section: 'Job details', help: 'Responsibilities and what the role is about.' },
    { name: 'requirements', label: 'Requirements', kind: 'textarea', maxLength: 5000, rows: 5, help: 'One requirement per line.', section: 'Job details' },
    { name: 'status', label: 'Status', kind: 'select', required: true, options: opts(['open', 'closing-soon', 'closed', 'filled']), section: 'Publishing', help: 'Open and closing soon postings are visible to employees.' },
    { name: 'published_at', label: 'Publish date', kind: 'datetime', section: 'Publishing', help: 'Optional. Leave empty to publish immediately.' },
    { name: 'closing_at', label: 'Closing date', kind: 'datetime', section: 'Publishing', help: 'Optional. Applications stop after this date.' },
    { name: 'application_enabled', label: 'Accept applications', kind: 'checkbox', section: 'Applications', help: 'Employees can apply to this posting from the portal.' },
    { name: 'referral_enabled', label: 'Accept referrals', kind: 'checkbox', section: 'Applications', help: 'Employees can refer someone for this position.' },
  ],
  initial: { title: '', department: '', location: '', employment_type: 'full-time', work_arrangement: 'on-site', summary: '', description: '', requirements: '', status: 'open', application_enabled: true, referral_enabled: true, published_at: '', closing_at: '' },
  quickActions: [
    { label: 'Reopen', field: 'status', value: 'open', from: ['closed'] },
    { label: 'Close posting', field: 'status', value: 'closed', from: ['open', 'closing-soon'], confirm: { title: 'Close this posting?', reversible: true, body: (r) => <p>Applications and referrals for <strong>{text(r, 'title')}</strong> will stop being accepted. The posting stays visible as closed and can be reopened.</p> } },
  ],
  label: (r) => text(r, 'title'),
}

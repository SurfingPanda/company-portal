import type { ReactNode } from 'react'
import type { AdminColumn } from '@/components/admin/AdminTable'
import type { FieldDef } from '@/components/admin/AdminField'
import type { FilterDef } from '@/components/admin/AdminFilters'
import type { AdminRecord } from '@/types/admin'

/** A one-click status change in a list row (publish, archive, close…). Always confirmed when it hides content. */
export interface QuickAction {
  label: string
  /** Sent as `{ [field]: value }`. */
  field: string
  value: string
  /** Show only when the record's current value of `field` is one of these. */
  from: string[]
  /** Needs a confirmation dialog (anything that removes content from employees). */
  confirm?: { title: string; body: (record: AdminRecord) => ReactNode; reversible: boolean }
}

/**
 * Describes one content module for the generic list and form screens. The screens add no module-specific code: the same list
 * (search, filters, sort, pagination, row actions, confirmation) and form (validation errors from Laravel, create/edit) serve
 * announcements, calendar, documents, forms, request types, benefits, resources and job postings.
 */
export interface CrudConfig {
  title: string
  singular: string
  description: string
  /** Frontend route of the list, e.g. /admin/documents. Create is `${route}/create`, edit `${route}/:id/edit`. */
  route: string
  /** Laravel collection endpoint, e.g. /api/admin/documents. */
  api: string
  columns: AdminColumn<AdminRecord>[]
  defaultSort: string
  filters: FilterDef[]
  fields: FieldDef[]
  quickActions?: QuickAction[]
  /** Hide the delete action (records that are deactivated or archived instead). */
  noDelete?: boolean
  /** Extra buttons next to "Create" in the list header (e.g. an import page). */
  extraActions?: { label: string; href: string }[]
  /** Name of the record used in confirmations. */
  label: (record: AdminRecord) => string
  /** Convert an API record into form values (strings/booleans). */
  toForm?: (record: AdminRecord) => Record<string, string | boolean>
  /** Convert form values into the API body. Receives mode so create-only fields can be omitted on edit. */
  toBody?: (values: Record<string, string | boolean>, mode: 'create' | 'edit') => Record<string, unknown>
  /** Returns the reason a field is read-only for this record (e.g. it is system-managed), or undefined when it is editable. */
  lockReason?: (record: AdminRecord, fieldName: string) => string | undefined
  /** Select fields whose options come from Laravel (e.g. the categories or documents that exist). Keyed by field name. */
  dynamicOptions?: Record<string, () => Promise<{ value: string; label: string }[]>>
  /** One-line explanation shown under a section heading, keyed by the section title. */
  sectionHints?: Record<string, string>
  /** Initial values for the create form. */
  initial: Record<string, string | boolean>
}

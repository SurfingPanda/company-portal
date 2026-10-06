export type PolicyAudience = 'all' | 'managers' | 'departments'
export type PolicyStatus = 'draft' | 'published' | 'archived'

/** What an employee sees in their list. `status` is about THEM: pending, overdue (past the due date) or acknowledged. */
export interface PolicySummary {
  id: number
  title: string
  summary: string | null
  version: number
  status: 'pending' | 'overdue' | 'acknowledged'
  effective_date: string | null
  due_date: string | null
  updated_at: string | null
  acknowledged_at: string | null
  /** Set when they read an older version: the policy changed, so it is asked again. */
  previously_acknowledged_version: number | null
}

export interface PolicyDetail extends PolicySummary {
  body: string
}

export interface PolicyProgress {
  required: number
  acknowledged: number
  outstanding: number
  percent: number
}

/** A policy as HR manages it. `progress` is null until it is published. */
export interface AdminPolicy {
  id: number
  title: string
  summary: string | null
  body: string
  version: number
  status: PolicyStatus
  audience: PolicyAudience
  department_ids: number[]
  departments: string[]
  effective_date: string | null
  due_date: string | null
  published_at: string | null
  version_published_at: string | null
  last_reminded_at: string | null
  updated_at: string | null
  progress: PolicyProgress | null
}

export interface PolicyReportRow {
  employee_id: string
  display_name: string | null
  email: string
  job_title: string | null
  department: string | null
  manager: string | null
  account_status: string
  acknowledged_at: string | null
  previously_acknowledged_version: number | null
}

export interface PolicyReport {
  data: PolicyReportRow[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  summary: PolicyProgress & { version: number; due_date: string | null; status: PolicyStatus }
}

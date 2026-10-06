import { PENDING_TEXT } from '@/data/companyData'
import { api } from '@/services/api'
import type { ApiResponse } from '@/types/api'
import type { CompanyMilestone, CompanyProfile, ContentStatus, Department, LeadershipMember, Location, OrganizationNode, OrganizationStructure } from '@/types/company'

/**
 * Company information, Laravel adapter: GET /api/company[/history|/leadership|/departments|/locations]. Laravel returns only
 * PUBLISHED content. Nothing is invented: when HR has not published the overview, the page shows the pending placeholder.
 * Rows flagged `is_sample` are shown as placeholders, anything else as official.
 */
const status = (sample?: boolean): ContentStatus => (sample ? 'placeholder' : 'official')

interface ApiOverview {
  display_name: string | null
  introduction_title: string | null
  introduction: string | null
  mission: string | null
  vision: string | null
  core_values: { title: string; description: string | null }[]
  is_sample: boolean
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const o = (await api.get<ApiResponse<ApiOverview | null>>('/api/company')).data
  const statement = (text: string | null | undefined) => {
    const has = Boolean(text && text.trim())
    return { text: has ? (text as string) : PENDING_TEXT, status: (has ? status(o?.is_sample) : 'placeholder') as ContentStatus }
  }
  return {
    name: o?.display_name || 'Company',
    introductionTitle: o?.introduction_title || 'About the company',
    introduction: statement(o?.introduction),
    mission: statement(o?.mission),
    vision: statement(o?.vision),
    values: (o?.core_values ?? []).map((v, i) => ({ id: `value-${i}`, title: v.title, description: v.description ?? undefined, status: status(o?.is_sample) })),
  }
}

export async function getCompanyHistory(): Promise<CompanyMilestone[]> {
  const rows = (await api.get<ApiResponse<{ id: number; year: string | null; title: string; description: string | null; is_sample: boolean }[]>>('/api/company/history')).data
  return rows.map((r) => ({ id: String(r.id), year: r.year ?? undefined, title: r.title, description: r.description ?? undefined, status: status(r.is_sample) }))
}

export async function getLeadership(): Promise<LeadershipMember[]> {
  const rows = (await api.get<ApiResponse<{ id: number; name: string; title: string; area: string | null; biography: string | null; is_sample: boolean }[]>>('/api/company/leadership')).data
  return rows.map((r) => ({ id: String(r.id), name: r.name, position: r.title, department: r.area ?? undefined, biography: r.biography ?? undefined, status: status(r.is_sample) }))
}

export async function getDepartments(): Promise<Department[]> {
  const rows = (await api.get<ApiResponse<{ id: number; name: string; description: string | null; head: string | null; employee_count: number; is_sample: boolean }[]>>('/api/company/departments')).data
  return rows.map((r) => ({ id: String(r.id), name: r.name, description: r.description ?? '', head: r.head ?? undefined, employeeCount: r.employee_count, directoryFilter: r.name, status: status(r.is_sample) }))
}

export async function getLocations(): Promise<Location[]> {
  const rows = (await api.get<ApiResponse<{ id: number; name: string; address: string | null; phone: string | null; email: string | null; operating_info: string | null; is_sample: boolean }[]>>('/api/company/locations')).data
  return rows.map((r) => ({ id: String(r.id), name: r.name, address: r.address ?? undefined, phone: r.phone ?? undefined, email: r.email ?? undefined, businessHours: r.operating_info ?? undefined, status: status(r.is_sample) }))
}

/**
 * The people tree, built from the reporting lines HR keeps on the employee records (GET /api/directory/organization).
 * One top person becomes the root; several (or an incomplete structure) hang under the company. When no reporting lines exist
 * yet it falls back to the published departments and says so, so the page never shows an invented hierarchy as fact.
 */
export async function getOrganizationStructure(): Promise<OrganizationStructure> {
  const [profile, rows] = await Promise.all([
    getCompanyProfile(),
    api.get<ApiResponse<{ employee_id: string; display_name: string; job_title: string | null; department: string | null; manager_employee_id: string | null }[]>>('/api/directory/organization').then((r) => r.data),
  ])
  const withReports = rows.filter((r) => r.manager_employee_id !== null)
  if (withReports.length === 0) {
    const departments = await getDepartments()
    return { root: { id: 'company', label: profile.name, children: departments.map((d) => ({ id: d.id, label: d.name })) }, status: 'placeholder' }
  }

  const nodes = new Map<string, OrganizationNode>(
    rows.map((r) => [r.employee_id, { id: r.employee_id, label: r.display_name, subtitle: [r.job_title, r.department].filter(Boolean).join(' · ') || undefined, href: `/directory/${encodeURIComponent(r.employee_id)}`, children: [] }]),
  )
  const roots: OrganizationNode[] = []
  for (const r of rows) {
    const node = nodes.get(r.employee_id)!
    const parent = r.manager_employee_id ? nodes.get(r.manager_employee_id) : undefined
    if (parent) parent.children!.push(node)
    else roots.push(node)
  }
  const prune = (n: OrganizationNode): OrganizationNode => ({ ...n, children: n.children && n.children.length > 0 ? n.children.map(prune) : undefined })
  return { root: roots.length === 1 ? prune(roots[0]) : { id: 'company', label: profile.name, children: roots.map(prune) }, status: 'official' }
}

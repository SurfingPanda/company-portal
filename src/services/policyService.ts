import { api } from '@/services/api'
import { adminApi, type ListParams } from '@/services/admin/adminApi'
import { isApiMode } from '@/services/dataMode'
import type { AdminPage } from '@/types/admin'
import type { ApiResponse } from '@/types/api'
import type { AdminPolicy, PolicyDetail, PolicyReport, PolicySummary } from '@/types/policy'

/**
 * Policies. Employees read them and confirm they did; HR publishes them and sees who has not. These need the Laravel server:
 * in development mock mode there is no policy data, so the employee list is simply empty.
 */

// --- Employees ---------------------------------------------------------------------------------------------------------

export async function getMyPolicies(status?: 'pending' | 'acknowledged'): Promise<{ policies: PolicySummary[]; pending: number }> {
  if (!isApiMode) return { policies: [], pending: 0 }
  const response = await api.get<{ data: PolicySummary[]; meta: { pending: number } }>('/api/policies', { status })
  return { policies: response.data, pending: response.meta.pending }
}

export const getPolicy = async (id: number | string): Promise<PolicyDetail> => (await api.get<ApiResponse<PolicyDetail>>(`/api/policies/${id}`)).data

/** Confirm the policy was read. `version` must be the version the person saw. */
export const acknowledgePolicy = async (id: number, version: number): Promise<PolicyDetail> =>
  (await api.post<ApiResponse<PolicyDetail>>(`/api/policies/${id}/acknowledge`, { version, confirm: true })).data

// --- HR ----------------------------------------------------------------------------------------------------------------

export const getAdminPolicies = (params: ListParams): Promise<AdminPage<AdminPolicy>> => adminApi.list<AdminPolicy>('/api/admin/policies', params)
export const getAdminPolicy = (id: number | string) => adminApi.get<AdminPolicy>(`/api/admin/policies/${id}`)

export interface PolicyInput {
  title: string
  summary: string | null
  body: string
  audience: AdminPolicy['audience']
  department_ids: number[]
  effective_date: string | null
  due_date: string | null
  status: AdminPolicy['status']
}

export const createPolicy = (body: PolicyInput) => adminApi.create<AdminPolicy>('/api/admin/policies', body)
export const updatePolicy = (id: number, body: Partial<PolicyInput>) => adminApi.update<AdminPolicy>(`/api/admin/policies/${id}`, body)
export const publishNewVersion = (id: number, body: { due_date?: string | null }) => adminApi.create<AdminPolicy>(`/api/admin/policies/${id}/new-version`, body)
export const remindOutstanding = (id: number) => adminApi.create<{ notified: number }>(`/api/admin/policies/${id}/remind`, {})

export interface ReportParams extends ListParams {
  status?: 'pending' | 'acknowledged' | 'all'
  department_id?: number
}

export const getPolicyReport = (id: number | string, params: ReportParams) => api.get<PolicyReport>(`/api/admin/policies/${id}/acknowledgements`, params)

import { api } from '@/services/api'
import { isApiMode } from '@/services/dataMode'
import type {
  AdminDashboardData, AdminPage, AdminRecord, AdminRole, AdminUser, AccountStatus, AuditEntry, PermissionGroup, SettingsResponse,
} from '@/types/admin'
import type { ApiResponse } from '@/types/api'

/**
 * Administration service layer. Thin, typed wrappers over the central API client for /api/admin/* (plus the management
 * endpoints the employee API already exposes, e.g. announcements). There is no mock mode for administration: it needs Laravel,
 * which authorizes every call. `adminAvailable` lets the shell say so instead of showing fake data.
 */
export const adminAvailable = isApiMode

export type ListParams = Record<string, string | number | boolean | undefined>

export const adminApi = {
  list: <T>(path: string, params?: ListParams) => api.get<AdminPage<T>>(path, params),
  get: async <T>(path: string) => (await api.get<ApiResponse<T>>(path)).data,
  create: async <T>(path: string, body: unknown) => (await api.post<ApiResponse<T>>(path, body)).data,
  update: async <T>(path: string, body: unknown) => (await api.put<ApiResponse<T>>(path, body)).data,
  patch: async <T>(path: string, body: unknown) => (await api.patch<ApiResponse<T>>(path, body)).data,
  remove: (path: string) => api.delete<void>(path),
  /** Multipart upload (e.g. a CSV file). */
  upload: async <T>(path: string, form: FormData) => (await api.upload<ApiResponse<T>>(path, form)).data,
}

// --- Overview ---------------------------------------------------------------------------------------------------------
export const getAdminDashboard = () => adminApi.get<AdminDashboardData>('/api/admin/dashboard')
export const getAuditLog = (params: ListParams) => adminApi.list<AuditEntry>('/api/admin/activity-log', params)
export const getSettings = () => api.get<SettingsResponse>('/api/admin/settings')
export const saveSettings = (values: Record<string, string | null>) => api.put<SettingsResponse>('/api/admin/settings', values)

// --- Users, roles, permissions ----------------------------------------------------------------------------------------
export const getUsers = (params: ListParams) => adminApi.list<AdminUser>('/api/admin/users', params)
export const getUser = (id: string | number) => adminApi.get<AdminUser>(`/api/admin/users/${id}`)
export const createUser = (body: { employee_id: string; email: string; role: string; status: AccountStatus }) => adminApi.create<AdminUser>('/api/admin/users', body)
export const updateUserEmail = (id: number, email: string) => adminApi.update<AdminUser>(`/api/admin/users/${id}`, { email })
export const setUserStatus = (id: number, status: AccountStatus) => adminApi.patch<AdminUser>(`/api/admin/users/${id}/status`, { status })
/** Emails the user an activation (pending) or password reset (active) link. */
export const sendUserPasswordLink = (id: number) => adminApi.create<{ message: string }>(`/api/admin/users/${id}/password-link`, {})
export const addUserRole = (id: number, role: string) => adminApi.create<AdminUser>(`/api/admin/users/${id}/roles`, { role })
export const removeUserRole = async (id: number, role: string) => (await api.delete<ApiResponse<AdminUser>>(`/api/admin/users/${id}/roles/${encodeURIComponent(role)}`)).data
export interface UserAccess {
  user: { id: number; employee_id: string; email: string; roles: AdminUser['roles']; status: AccountStatus }
  from_roles: string[]
  granted: string[]
  catalog: { group: string; items: { permission: string; label: string; hint: string }[] }[]
}
export const getUserAccess = (id: string | number) => adminApi.get<UserAccess>(`/api/admin/users/${id}/access`)
export const saveUserAccess = (id: number, permissions: string[]) => adminApi.update<UserAccess>(`/api/admin/users/${id}/access`, { permissions })
export interface AccessTemplate { id: number; name: string; description: string | null; permissions: string[] }
export type AccessCatalog = UserAccess['catalog']
export const getAccessTemplates = () => api.get<{ data: AccessTemplate[]; catalog: AccessCatalog }>('/api/admin/access-templates')
export const saveAccessTemplate = (t: AccessTemplate) => {
  const body = { name: t.name.trim(), description: t.description?.trim() || null, permissions: t.permissions }
  return t.id ? adminApi.update<AccessTemplate>(`/api/admin/access-templates/${t.id}`, body) : adminApi.create<AccessTemplate>('/api/admin/access-templates', body)
}
export const deleteAccessTemplate = (id: number) => adminApi.remove(`/api/admin/access-templates/${id}`)
export const getRoles = () => adminApi.get<AdminRole[]>('/api/admin/roles')
export const getPermissionGroups = () => adminApi.get<PermissionGroup[]>('/api/admin/permissions')

// --- Operations ---------------------------------------------------------------------------------------------------------
export const getReviewRequests = (params: ListParams) => adminApi.list<AdminRecord>('/api/requests', { scope: 'review', ...params })
export const getAdminRequest = (id: string | number) => adminApi.get<AdminRecord>(`/api/requests/${id}`)
export const setRequestStatus = (id: number, body: { status: string; comment?: string; internal?: boolean }) => adminApi.create<AdminRecord>(`/api/requests/${id}/status`, body)
export const getAdminTickets = (params: ListParams) => adminApi.list<AdminRecord>('/api/helpdesk/tickets', { scope: 'all', ...params })
export const getAdminTicket = (id: string | number) => adminApi.get<AdminRecord>(`/api/helpdesk/tickets/${id}`)
export const updateTicket = (id: number, body: { status?: string; priority?: string; assigned_to?: string | null }) => adminApi.patch<AdminRecord>(`/api/helpdesk/tickets/${id}`, body)
/** Take ownership of an unassigned ticket (409 when someone else already owns it). */
export const claimTicket = (id: number) => adminApi.create<AdminRecord>(`/api/helpdesk/tickets/${id}/claim`, {})
export const replyToTicketAsStaff = (id: number, message: string) => adminApi.create<AdminRecord>(`/api/helpdesk/tickets/${id}/replies`, { message })
export const sendNotification = (body: Record<string, unknown>) => api.post<ApiResponse<{ delivered: number }>>('/api/admin/notifications', body)

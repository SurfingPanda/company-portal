import { api } from '@/services/api'
import { adminApi } from '@/services/admin/adminApi'
import { isApiMode } from '@/services/dataMode'
import type { ApiResponse } from '@/types/api'
import type { PersonalInfo } from '@/types/personalInfo'

/**
 * The employee's own personal details and emergency contacts (GET/PUT /api/profile/personal). They need the Laravel server: in
 * development mock mode nothing is stored, so the form starts empty and saving does nothing.
 */
export const EMPTY_PERSONAL_INFO: PersonalInfo = {
  date_of_birth: null, civil_status: null, share_birthday: false, share_anniversary: true, address_line: null, city: null, province: null, postal_code: null, emergency_contacts: [],
}

export async function getPersonalInfo(): Promise<PersonalInfo> {
  if (!isApiMode) return EMPTY_PERSONAL_INFO
  return (await api.get<ApiResponse<PersonalInfo>>('/api/profile/personal')).data
}

/** Sends only what is given. `emergency_contacts`, when present, replaces the whole list. */
export async function savePersonalInfo(changes: Partial<PersonalInfo>): Promise<PersonalInfo> {
  if (!isApiMode) return { ...EMPTY_PERSONAL_INFO, ...changes }
  return (await api.put<ApiResponse<PersonalInfo>>('/api/profile/personal', changes)).data
}

/** HR: one employee's details (the directory entry id). Every call is written to the audit log. */
export const getEmployeePersonalInfo = (entryId: number | string) => adminApi.get<PersonalInfo | null>(`/api/admin/hr/employees/${entryId}/personal`)

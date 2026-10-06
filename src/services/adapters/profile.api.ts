import { mapApiUser, type ApiUser } from '@/services/adapters/auth.api'
import { api } from '@/services/api'
import type { ApiResponse } from '@/types/api'
import type { AuthenticatedUser, ProfileUpdate } from '@/types/user'

/**
 * Profile, Laravel adapter: GET/PUT /api/profile.
 * Only the self-service fields are sent (preferred name, personal email, mobile). Official fields (employee ID, job title,
 * department, manager, status, date joined) are maintained by HR and are never part of this call, so they cannot be edited here.
 * The avatar is sent only if it is an https address; a local preview is never uploaded (no avatar storage exists yet).
 */
export async function getCurrentUser(): Promise<AuthenticatedUser> {
  return mapApiUser((await api.get<ApiResponse<ApiUser>>('/api/profile')).data)
}

export async function updateProfile(changes: ProfileUpdate): Promise<ProfileUpdate & { profileUpdatedAt: string }> {
  const body: Record<string, string | null> = {
    preferred_name: changes.preferredName ?? null,
    personal_email: changes.personalEmail ?? null,
    mobile_number: changes.mobileNumber ?? null,
  }
  if (changes.avatarUrl?.startsWith('https://')) body.avatar_url = changes.avatarUrl
  const user = mapApiUser((await api.put<ApiResponse<ApiUser>>('/api/profile', body)).data)
  return {
    preferredName: user.preferredName,
    personalEmail: user.personalEmail,
    mobileNumber: user.mobileNumber,
    avatarUrl: user.avatarUrl,
    profileUpdatedAt: user.profileUpdatedAt ?? new Date().toISOString(),
  }
}

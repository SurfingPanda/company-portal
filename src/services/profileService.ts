import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/profile.api'
import { currentUser } from '@/data/currentUser'
import type { AuthenticatedUser, ProfileUpdate, UserPreferences } from '@/types/user'

/**
 * Service layer for the signed-in employee's profile and account.
 *
 * These functions are the boundary where the Laravel API will connect. They currently only read and
 * return local sample data (no network requests are made). Future endpoints:
 *   getCurrentUser   -> GET    /api/me   (and GET /api/profile)
 *   updateProfile    -> PUT    /api/profile
 *   uploadAvatar     -> POST   /api/profile/avatar
 *   removeAvatar     -> DELETE /api/profile/avatar
 *   updatePreferences-> PUT    /api/account/preferences
 * Authentication (login, logout, password and MFA changes) is intentionally not represented here.
 */

const MOCK_LATENCY_MS = 200
const wait = (ms = MOCK_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const pad = (n: number) => String(n).padStart(2, '0')
const nowIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function mockGetCurrentUser(): Promise<AuthenticatedUser> {
  await wait()
  return { ...currentUser }
}

/** PUT /api/profile. Returns the updated fields; the server would also stamp `profileUpdatedAt`. */
async function mockUpdateProfile(changes: ProfileUpdate): Promise<ProfileUpdate & { profileUpdatedAt: string }> {
  await wait(400)
  return { ...changes, profileUpdatedAt: nowIso() }
}

/** PUT /api/account/preferences */
export async function updatePreferences(preferences: UserPreferences): Promise<UserPreferences> {
  await wait(300)
  return { ...preferences }
}

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getCurrentUser: typeof mockGetCurrentUser = isApiMode ? apiAdapter.getCurrentUser : mockGetCurrentUser
export const updateProfile: typeof mockUpdateProfile = isApiMode ? apiAdapter.updateProfile : mockUpdateProfile

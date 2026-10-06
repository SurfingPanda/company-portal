import type { UserRole } from '@/auth/roles'
import { getCurrentUser as getSampleUser } from '@/services/profileService'
import { apiRequest, ApiRequestError } from '@/services/api'
import { mapApiUser, type ApiUser } from '@/services/adapters/auth.api'
import type { ApiResponse } from '@/types/api'
import type { AuthErrorKind, AuthMode, LoginCredentials } from '@/types/auth'
import type { AuthenticatedUser } from '@/types/user'

/**
 * AUTHENTICATION SERVICE: the only module that knows how sign-in works.
 *
 * REAL MODE ("api", always used in production builds)
 *   Laravel session authentication (Sanctum SPA flow):
 *     GET  /sanctum/csrf-cookie   (done by the API client)
 *     POST /api/auth/login        { identifier, password, remember }  -> { user }
 *     GET  /api/auth/me                                                -> { user }  (401 when signed out)
 *     POST /api/auth/logout
 *   The server-side session/cookie is the session. The browser stores no password, token or employee data.
 *   Authorization is decided by the server; nothing in the React app is a security boundary.
 *
 * MOCK MODE (development builds only, `VITE_AUTH_MODE=mock`)
 *   Exists so the portal can be built without a backend. It is NOT secure and must never be a production path:
 *   `import.meta.env.PROD` forces real mode even if `VITE_AUTH_MODE=mock` is set. The sample account is documented in
 *   AUTHENTICATION.md and never shown in the UI. The only thing stored is a non-sensitive "dev session" flag.
 */

/** Production builds always use the real API. In development, mock is the default until a backend exists. */
export const AUTH_MODE: AuthMode = import.meta.env.PROD ? 'api' : (import.meta.env.VITE_AUTH_MODE as string | undefined) === 'api' ? 'api' : 'mock'

if (import.meta.env.PROD && (import.meta.env.VITE_AUTH_MODE as string | undefined) === 'mock') {
  console.warn('VITE_AUTH_MODE=mock is ignored in production builds. The real API is used.')
}

/** Failure with a coarse, user-safe category. Never carries backend details. */
export class AuthError extends Error {
  kind: AuthErrorKind

  constructor(kind: AuthErrorKind) {
    super(kind)
    this.name = 'AuthError'
    this.kind = kind
  }
}

function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error
  if (error instanceof ApiRequestError) {
    if (error.kind === 'network') return new AuthError('network')
    if (error.status === 401 || error.status === 422) return new AuthError('invalid-credentials')
    if (error.status === 403) return new AuthError('forbidden')
  }
  return new AuthError('server')
}

// ---------------------------------------------------------------------------------------------------------------------
// Real mode
// ---------------------------------------------------------------------------------------------------------------------

const apiAuth = {
  async getSession(): Promise<AuthenticatedUser | null> {
    try {
      return mapApiUser((await apiRequest<ApiResponse<ApiUser>>('/api/auth/me')).data)
    } catch (error) {
      // Not signed in (or not authorised): that is a normal "no session", not a failure.
      if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) return null
      throw toAuthError(error)
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthenticatedUser> {
    try {
      const response = await apiRequest<ApiResponse<ApiUser>>('/api/auth/login', {
        method: 'POST',
        body: { identifier: credentials.identifier, password: credentials.password, remember: credentials.rememberMe === true },
      })
      return mapApiUser(response.data)
    } catch (error) {
      throw toAuthError(error)
    }
  },

  async logout(): Promise<void> {
    await apiRequest<void>('/api/auth/logout', { method: 'POST' })
  },
}

// ---------------------------------------------------------------------------------------------------------------------
// Mock mode (development only)
// ---------------------------------------------------------------------------------------------------------------------

const MOCK_LATENCY_MS = 600
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Non-sensitive dev session marker: holds only which demo account is signed in. No credentials, no employee data. */
const MOCK_SESSION_KEY = 'eljin-dev-mock-session'

/** DEVELOPMENT SAMPLE PASSWORD for every demo account. Documented in AUTHENTICATION.md. Not for production. */
const MOCK_PASSWORD = 'DemoOnly123!'

interface MockAccount {
  /** Employee ID. The company email below also signs in. */
  employeeId: string
  email: string
  /** How this account differs from the base sample user (fictional people only). */
  profile: Partial<AuthenticatedUser>
  roles: UserRole[]
}

/**
 * DEMO ACCOUNTS (fictional, development only): one per portal role. Role is the system role that drives permissions,
 * not the job title. Real role assignment is done by the backend.
 */
const MOCK_ACCOUNTS: MockAccount[] = [
  { employeeId: 'EMP-0001', email: 'arvin.leano@eljin.example', profile: {}, roles: ['employee'] },
  { employeeId: 'EMP-0002', email: 'ramon.aquino@eljin.example', roles: ['manager'], profile: { firstName: 'Ramon', lastName: 'Aquino', jobTitle: 'MIS Manager', directoryEmployeeId: 'EMP-010' } },
  { employeeId: 'EMP-0003', email: 'grace.ramos@eljin.example', roles: ['hr'], profile: { firstName: 'Grace', lastName: 'Ramos', jobTitle: 'HR Manager', departmentName: 'Human Resources', directoryEmployeeId: 'EMP-011' } },
  { employeeId: 'EMP-0004', email: 'carlo.mendoza@eljin.example', roles: ['it'], profile: { firstName: 'Carlo', lastName: 'Mendoza', jobTitle: 'Systems Administrator', directoryEmployeeId: 'EMP-006' } },
  { employeeId: 'EMP-0005', email: 'portal.admin@eljin.example', roles: ['admin'], profile: { firstName: 'Portal', lastName: 'Administrator', jobTitle: 'Portal Administrator', directoryEmployeeId: undefined } },
]

const findAccount = (identifier: string) => {
  const wanted = identifier.trim().toLowerCase()
  return MOCK_ACCOUNTS.find((a) => a.employeeId.toLowerCase() === wanted || a.email === wanted)
}

async function buildMockUser(account: MockAccount): Promise<AuthenticatedUser> {
  const base = await getSampleUser()
  return {
    ...base,
    ...account.profile,
    id: `mock-${account.employeeId.toLowerCase()}`,
    employeeId: account.employeeId,
    workEmail: account.email,
    // Only the base sample user has personal contact details.
    personalEmail: account.employeeId === 'EMP-0001' ? base.personalEmail : undefined,
    mobileNumber: account.employeeId === 'EMP-0001' ? base.mobileNumber : undefined,
    roles: account.roles,
    permissions: undefined,
  }
}

const mockStorage = {
  get: (): string | null => {
    try {
      return window.sessionStorage.getItem(MOCK_SESSION_KEY) ?? window.localStorage.getItem(MOCK_SESSION_KEY)
    } catch {
      return null
    }
  },
  set: (employeeId: string, persistent: boolean) => {
    try {
      // Keep the marker in whichever storage it already lives in, so switching role does not change its lifetime.
      const inLocal = window.localStorage.getItem(MOCK_SESSION_KEY) !== null
      ;(persistent || inLocal ? window.localStorage : window.sessionStorage).setItem(MOCK_SESSION_KEY, employeeId)
    } catch {
      // storage unavailable: the dev session simply won't survive a reload
    }
  },
  clear: () => {
    try {
      window.sessionStorage.removeItem(MOCK_SESSION_KEY)
      window.localStorage.removeItem(MOCK_SESSION_KEY)
    } catch {
      // ignore
    }
  },
}

const mockAuth = {
  async getSession(): Promise<AuthenticatedUser | null> {
    await wait(150)
    const stored = mockStorage.get()
    const account = stored ? findAccount(stored) : undefined
    return account ? buildMockUser(account) : null
  },

  async login(credentials: LoginCredentials): Promise<AuthenticatedUser> {
    await wait(MOCK_LATENCY_MS)
    const account = findAccount(credentials.identifier)
    if (!account || credentials.password !== MOCK_PASSWORD) throw new AuthError('invalid-credentials')
    mockStorage.set(account.employeeId, credentials.rememberMe === true)
    return buildMockUser(account)
  },

  async logout(): Promise<void> {
    await wait(100)
    mockStorage.clear()
  },
}

/**
 * DEVELOPMENT ONLY: switches the signed-in demo account to the one with the given role. Refuses to run unless the app is a
 * development build in mock mode, so it can never act against the real backend.
 */
export function switchMockRole(role: UserRole): void {
  if (import.meta.env.PROD || AUTH_MODE !== 'mock') throw new Error('Role switching is only available in development mock mode.')
  const account = MOCK_ACCOUNTS.find((a) => a.roles.includes(role))
  if (account) mockStorage.set(account.employeeId, false)
}

/** DEVELOPMENT ONLY: the mock roles that can be chosen. Empty outside development mock mode. */
export const MOCK_ROLE_CHOICES: UserRole[] = !import.meta.env.PROD && AUTH_MODE === 'mock' ? MOCK_ACCOUNTS.flatMap((a) => a.roles) : []

const backend = AUTH_MODE === 'api' ? apiAuth : mockAuth

/** Returns the signed-in employee, or null when there is no session. Throws AuthError('network' | 'server') on failure. */
export const getSession = (): Promise<AuthenticatedUser | null> => backend.getSession()

/** Signs in and returns the employee. Throws AuthError with a coarse kind on failure. */
export const login = (credentials: LoginCredentials): Promise<AuthenticatedUser> => backend.login(credentials)

/** Ends the session on the server. The caller clears local state even if this throws. */
export const logout = (): Promise<void> => backend.logout()

/**
 * "Forgot password": asks Laravel to email a one-time link. The answer is deliberately the same whether or not the account
 * exists. Only meaningful in real mode (mock mode has no server and no email).
 */
export const requestPasswordReset = (identifier: string) =>
  apiRequest<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: { identifier } })

/** What the sign-in page should ask for after the person typed their employee ID or company email. */
export type SignInStep = { step: 'password' } | { step: 'setup'; emailHint: string; codeMinutes: number }

/**
 * Step 1 of sign-in. `password`: ask for the password. `setup`: first time, a 6-digit code was emailed and the person now
 * chooses a password. Unknown identifiers answer `password`, so only a genuine new account is revealed. Mock mode: always `password`.
 */
export async function identifyAccount(identifier: string): Promise<SignInStep> {
  if (AUTH_MODE !== 'api') return { step: 'password' }
  try {
    const { data } = await apiRequest<ApiResponse<{ step: 'password' | 'setup'; email_hint?: string; code_minutes?: number }>>('/api/auth/identify', { method: 'POST', body: { identifier } })
    return data.step === 'setup' ? { step: 'setup', emailHint: data.email_hint ?? 'your company email', codeMinutes: data.code_minutes ?? 15 } : { step: 'password' }
  } catch (error) {
    throw toAuthError(error)
  }
}

/** First sign-in: the emailed code plus the new password. Signs the person in. Rejects with ApiRequestError (field messages kept). */
export async function completeFirstSignIn(input: { identifier: string; code: string; password: string; passwordConfirmation: string }): Promise<AuthenticatedUser> {
  const response = await apiRequest<ApiResponse<ApiUser>>('/api/auth/first-sign-in', {
    method: 'POST',
    body: { identifier: input.identifier, code: input.code, password: input.password, password_confirmation: input.passwordConfirmation },
  })
  return mapApiUser(response.data)
}

/** Marks the first sign-in setup as finished on the server. Mock mode has no server and nothing to finish. */
export const completeOnboarding = async (): Promise<void> => {
  if (AUTH_MODE === 'api') await apiRequest('/api/auth/onboarding/complete', { method: 'POST' })
}

/** Chooses a password from an emailed link. Failures keep Laravel's field messages (bad/expired link, weak password). */
export const setPasswordFromLink = (token: string, password: string, passwordConfirmation: string) =>
  apiRequest<{ message: string }>('/api/auth/set-password', { method: 'POST', body: { token, password, password_confirmation: passwordConfirmation } })

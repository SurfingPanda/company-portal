import type { AuthenticatedUser } from '@/types/user'

/**
 * Authentication types. Provider-agnostic: nothing here assumes a particular identity provider.
 * The signed-in person is always the existing `AuthenticatedUser` (types/user.ts); there is no separate login user model.
 */

/** What the sign-in form submits. Held in memory for one call only; never stored or logged. */
export interface LoginCredentials {
  /** Employee ID or company email. */
  identifier: string
  password: string
  /** Passed to the backend, which decides session lifetime. It does not make the browser store anything. */
  rememberMe?: boolean
}

/** Body of `POST /api/auth/login` and `GET /api/auth/me`. The Laravel contract, if different, is adapted in authService. */
export interface AuthResponse {
  user: AuthenticatedUser
}

/** Sign-in/session failures as the UI sees them. Deliberately coarse so nothing about the account is revealed. */
export type AuthErrorKind = 'invalid-credentials' | 'forbidden' | 'network' | 'server'

/** Messages shown for each failure kind. */
export const authErrorMessages: Record<AuthErrorKind, string> = {
  'invalid-credentials': 'Invalid employee ID/email or password.',
  forbidden: 'Your account is not currently authorized to access the employee portal.',
  network: 'Unable to connect to the employee portal. Please try again.',
  server: 'Something went wrong while signing you in. Please try again later.',
}

/** How the portal authenticates. "mock" exists only in development builds. */
export type AuthMode = 'api' | 'mock'

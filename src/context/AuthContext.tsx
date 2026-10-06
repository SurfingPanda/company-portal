import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearStoredRecentSearches } from '@/hooks/useRecentSearches'
import { AuthError, completeFirstSignIn, getSession, login as signIn, logout as signOut } from '@/services/authService'
import { updatePreferences as savePreferences, updateProfile as saveProfile } from '@/services/profileService'
import type { LoginCredentials } from '@/types/auth'
import type { AuthenticatedUser, ProfileUpdate, UserPreferences } from '@/types/user'

interface AuthContextValue {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  /** True while the initial session check runs. Route guards wait for it instead of redirecting early. */
  isLoading: boolean
  /** Set when the session check failed for a reason other than "not signed in" (e.g. the server is unreachable). */
  error: Error | undefined
  /** Re-runs the session check, showing the loading state. */
  retry: () => void
  /** Signs in. Rejects with an `AuthError` (coarse kind only) on failure; the caller shows the matching message. */
  login: (credentials: LoginCredentials) => Promise<void>
  /** First sign-in: the emailed code plus a new password. Signs the person in. Rejects with the server's field messages. */
  firstSignIn: (input: { identifier: string; code: string; password: string; passwordConfirmation: string }) => Promise<void>
  /** Ends the session and clears local auth state. Local state is cleared even if the server call fails. */
  logout: () => Promise<void>
  /** Clears local auth state without calling the server. Used when an API call reports the session is gone (401). */
  expireSession: () => void
  /** Reloads the signed-in user quietly (GET /api/auth/me). */
  refreshUser: () => Promise<void>
  /** Applies a self-service profile change (PUT /api/profile later). */
  updateProfile: (changes: ProfileUpdate) => Promise<void>
  /** Applies preference changes (PUT /api/account/preferences later). */
  updatePreferences: (preferences: UserPreferences) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * The single source of "who is signed in". It talks only to `authService`, which uses the Laravel session API in
 * production (or a development-only mock). The rest of the portal reads it through `useAuth()`.
 * Nothing sensitive is kept in browser storage: the session lives in the server's cookie.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error>()
  const [attempt, setAttempt] = useState(0)

  // Application start: check for an existing session (GET /api/auth/me).
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(undefined)
    getSession().then(
      (current) => {
        if (cancelled) return
        setUser(current)
        setIsLoading(false)
      },
      (e: unknown) => {
        if (cancelled) return
        setUser(null)
        setError(e instanceof Error ? e : new AuthError('server'))
        setIsLoading(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const signedIn = await signIn(credentials)
    setError(undefined)
    setUser(signedIn)
  }, [])

  const firstSignIn = useCallback(async (input: { identifier: string; code: string; password: string; passwordConfirmation: string }) => {
    const signedIn = await completeFirstSignIn(input)
    setError(undefined)
    setUser(signedIn)
  }, [])

  const logout = useCallback(async () => {
    try {
      await signOut()
    } catch {
      // The server call failed. The UI must still not look signed in, so local state is cleared below regardless.
    } finally {
      setUser(null)
      // Search history is per-person; do not leave it behind on a shared computer.
      clearStoredRecentSearches()
    }
  }, [])

  const expireSession = useCallback(() => {
    setUser(null)
    clearStoredRecentSearches()
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      setUser(await getSession())
    } catch {
      // Keep the current user on a transient failure; the next request will surface a real sign-out (401).
    }
  }, [])

  const updateProfile = useCallback(async (changes: ProfileUpdate) => {
    const saved = await saveProfile(changes)
    setUser((prev) => (prev ? { ...prev, ...saved } : prev))
  }, [])

  const updatePreferences = useCallback(async (preferences: UserPreferences) => {
    const saved = await savePreferences(preferences)
    setUser((prev) => (prev ? { ...prev, preferences: saved } : prev))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, error, retry, login, firstSignIn, logout, expireSession, refreshUser, updateProfile, updatePreferences }),
    [user, isLoading, error, retry, login, firstSignIn, logout, expireSession, refreshUser, updateProfile, updatePreferences],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

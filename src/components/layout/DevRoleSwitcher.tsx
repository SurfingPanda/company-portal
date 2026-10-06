import { roleLabels, type UserRole } from '@/auth/roles'
import { useAuth } from '@/context/AuthContext'
import { DATA_MODE } from '@/services/dataMode'
import { AUTH_MODE, MOCK_ROLE_CHOICES, switchMockRole } from '@/services/authService'

/**
 * DEVELOPMENT ONLY. Shows which auth and data modes are active, and (in mock auth mode) lets a developer see the portal
 * as each demo role. It renders nothing in production builds and can never act on the real backend.
 */
export function DevRoleSwitcher() {
  const { user, refreshUser } = useAuth()
  if (import.meta.env.PROD || !user) return null
  const mockAuth = AUTH_MODE === 'mock'
  const current = user.roles[0]
  return (
    <div className="fixed bottom-3 right-3 z-50 border border-dashed border-muted-foreground/60 bg-white px-3 py-2 text-xs shadow-sm">
      <label htmlFor="dev-role" className="block font-semibold uppercase tracking-wider text-muted-foreground">
        Dev only · auth: {AUTH_MODE} · data: {DATA_MODE}
      </label>
      {mockAuth && (
      <select
        id="dev-role"
        value={current}
        onChange={async (e) => {
          switchMockRole(e.target.value as UserRole)
          await refreshUser()
        }}
        className="mt-1 h-8 w-full border bg-white px-1 text-sm text-foreground"
      >
        {MOCK_ROLE_CHOICES.map((r) => (
          <option key={r} value={r}>
            {roleLabels[r]}
          </option>
        ))}
      </select>
      )}
    </div>
  )
}

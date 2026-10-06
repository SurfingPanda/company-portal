import { AccountSection } from '@/components/account/AccountSection'
import { PreferenceChoice, PreferenceToggle } from '@/components/settings/PreferenceToggle'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'
import { clearStoredRecentSearches } from '@/hooks/useRecentSearches'
import type { ThemePreference } from '@/types/portalPreferences'

const labelClass = 'mb-1 block text-sm font-medium text-foreground'

/** Portal Preferences: start page, default resource view, search memory, appearance and language. Saves as you change. */
export function PreferencesPanel() {
  const { preferences, update } = usePortalPreferences()

  return (
    <div className="space-y-8">
      <AccountSection id="portal-preferences-heading" title="Portal Preferences" description="These settings only change how the Employee Portal looks and behaves for you. They are stored in this browser and do not affect HR data.">
        <div className="border-b border-border pb-3">
          <label htmlFor="pref-start-page" className={labelClass}>
            Dashboard Start Page
          </label>
          <Select value={preferences.dashboardStartPage} disabled>
            <SelectTrigger id="pref-start-page" className="h-9 w-full max-w-xs bg-white" aria-describedby="pref-start-page-help">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dashboard">Employee Dashboard</SelectItem>
            </SelectContent>
          </Select>
          <p id="pref-start-page-help" className="mt-1 text-xs text-muted-foreground">
            The Employee Dashboard is the only start page for now.
          </p>
        </div>

        <PreferenceChoice
          name="resource-view"
          legend="Default Resource View"
          description="How the Employee Resource Center lists resources."
          value={preferences.resourceView}
          options={[
            { value: 'cards', label: 'Cards' },
            { value: 'list', label: 'List' },
          ]}
          onChange={(resourceView) => update((p) => ({ ...p, resourceView }))}
        />

        <PreferenceToggle
          label="Remember Last Search"
          description="Keep your recent portal searches in this browser so you can reuse them. Turning this off also clears them."
          checked={preferences.rememberSearchHistory}
          onChange={(rememberSearchHistory) => {
            if (!rememberSearchHistory) clearStoredRecentSearches()
            update((p) => ({ ...p, rememberSearchHistory }))
          }}
        />
      </AccountSection>

      <AccountSection id="appearance-heading" title="Appearance" description="Light or dark display. The portal's colours and branding stay the same.">
        <PreferenceChoice<ThemePreference>
          name="theme"
          legend="Theme"
          description="System follows your device setting."
          value={preferences.appearance.theme}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={(theme) => update((p) => ({ ...p, appearance: { theme } }))}
        />
        <div className="py-3">
          <label htmlFor="pref-language" className={labelClass}>
            Language
          </label>
          <Select value="en" disabled>
            <SelectTrigger id="pref-language" className="h-9 w-full max-w-xs bg-white" aria-describedby="pref-language-help">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <p id="pref-language-help" className="mt-1 text-xs text-muted-foreground">
            Coming later. Other languages are not available yet.
          </p>
        </div>
      </AccountSection>
    </div>
  )
}

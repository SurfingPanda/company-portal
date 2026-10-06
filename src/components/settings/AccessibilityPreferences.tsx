import { AccountSection } from '@/components/account/AccountSection'
import { PreferenceChoice, PreferenceToggle } from '@/components/settings/PreferenceToggle'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'
import type { TextSize } from '@/types/portalPreferences'

/** Reduce motion, text size and contrast. Each applies immediately across the portal. */
export function AccessibilityPreferences() {
  const { preferences, update } = usePortalPreferences()
  const a = preferences.accessibility

  return (
    <AccountSection id="accessibility-heading" title="Accessibility" description="Display options that apply across the portal. Your device's reduced-motion setting is always respected too.">
      <div className="border-t border-border">
        <PreferenceToggle
          label="Reduce Motion"
          description="Reduce animations and transitions."
          checked={a.reduceMotion}
          onChange={(reduceMotion) => update((p) => ({ ...p, accessibility: { ...p.accessibility, reduceMotion } }))}
        />
        <PreferenceChoice<TextSize>
          name="text-size"
          legend="Text Size"
          description="Large increases text modestly. Layouts adjust."
          value={a.textSize}
          options={[
            { value: 'default', label: 'Default' },
            { value: 'large', label: 'Large' },
          ]}
          onChange={(textSize) => update((p) => ({ ...p, accessibility: { ...p.accessibility, textSize } }))}
        />
        <PreferenceToggle
          label="High Contrast"
          description="Stronger borders, secondary text and focus outlines. Colours and branding stay the same."
          checked={a.highContrast}
          onChange={(highContrast) => update((p) => ({ ...p, accessibility: { ...p.accessibility, highContrast } }))}
        />
      </div>
    </AccountSection>
  )
}

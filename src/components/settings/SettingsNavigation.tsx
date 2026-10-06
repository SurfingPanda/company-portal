import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export const settingsSections = [
  { id: 'preferences', label: 'Preferences' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'account', label: 'Account' },
] as const

export type SettingsSectionId = (typeof settingsSections)[number]['id']

interface SettingsNavigationProps {
  current: SettingsSectionId
  onChange: (id: SettingsSectionId) => void
}

/** Left-hand list on desktop; a compact select on small screens. */
export function SettingsNavigation({ current, onChange }: SettingsNavigationProps) {
  return (
    <>
      <nav aria-label="Settings sections" className="hidden lg:block">
        <ul className="border bg-white">
          {settingsSections.map((s) => (
            <li key={s.id} className="border-b last:border-b-0">
              <button
                type="button"
                onClick={() => onChange(s.id)}
                aria-current={current === s.id ? 'page' : undefined}
                className={cn(
                  'block w-full border-l-[3px] px-4 py-2.5 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  current === s.id ? 'border-gold bg-accent font-semibold text-primary' : 'border-transparent text-foreground/80 hover:bg-accent',
                )}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="lg:hidden">
        <label htmlFor="settings-section" className="mb-1 block text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
          Settings section
        </label>
        <Select value={current} onValueChange={(v) => onChange(v as SettingsSectionId)}>
          <SelectTrigger id="settings-section" className="h-10 w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {settingsSections.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

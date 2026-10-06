import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AccountInformation } from '@/components/account/AccountInformation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProfileError, ProfileSkeleton } from '@/components/profile/ProfileStates'
import { AccessibilityPreferences } from '@/components/settings/AccessibilityPreferences'
import { AccountSecurity } from '@/components/settings/AccountSecurity'
import { NotificationPreferences } from '@/components/settings/NotificationPreferences'
import { PreferencesPanel } from '@/components/settings/PreferencesPanel'
import { PrivacyPreferences } from '@/components/settings/PrivacyPreferences'
import { ResetPreferencesDialog } from '@/components/settings/ResetPreferencesDialog'
import { SettingsNavigation, settingsSections, type SettingsSectionId } from '@/components/settings/SettingsNavigation'
import { useAuth } from '@/context/AuthContext'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'

/** Account Settings: portal preferences and a read-only account summary. Nothing here changes HR records. */
export default function AccountSettingsPage() {
  const { user, isLoading, error, retry } = useAuth()
  const { persisted, revision } = usePortalPreferences()
  const [params, setParams] = useSearchParams()
  const current = settingsSections.find((s) => s.id === params.get('section'))?.id ?? 'preferences'

  // Subtle confirmation after any change. Preferences save immediately, so there is no Save button.
  const [notice, setNotice] = useState(false)
  useEffect(() => {
    if (revision === 0) return
    setNotice(true)
    const timer = setTimeout(() => setNotice(false), 2500)
    return () => clearTimeout(timer)
  }, [revision])

  const select = (id: SettingsSectionId) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (id === 'preferences') next.delete('section')
        else next.set('section', id)
        return next
      },
      { replace: true },
    )

  let account
  if (error) account = <ProfileError onRetry={retry} />
  else if (isLoading || !user) account = <ProfileSkeleton />
  else
    account = (
      <div className="space-y-8">
        <AccountInformation user={user} />
        <AccountSecurity />
      </div>
    )

  const panels: Record<SettingsSectionId, React.ReactNode> = {
    preferences: <PreferencesPanel />,
    notifications: <NotificationPreferences />,
    accessibility: <AccessibilityPreferences />,
    privacy: <PrivacyPreferences persisted={persisted} />,
    account,
  }

  return (
    <PageContainer className="pb-16">
      <PageHeader title="Account Settings" description="Manage your Employee Portal preferences and notification settings." breadcrumbs={[{ label: 'Account Settings' }]} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_1fr]">
        <div className="space-y-4 lg:self-start">
          <SettingsNavigation current={current} onChange={select} />
          <div className="hidden lg:block">
            <ResetPreferencesDialog />
          </div>
        </div>

        <div className="min-w-0">
          <p role="status" aria-live="polite" className="mb-4 h-5 text-sm font-medium text-primary">
            {notice && 'Preferences updated.'}
          </p>
          <div className="max-w-3xl">{panels[current]}</div>
          <div className="mt-8 border-t pt-4 lg:hidden">
            <ResetPreferencesDialog />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

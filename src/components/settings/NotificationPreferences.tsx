import { useState } from 'react'
import { Info, Mail } from 'lucide-react'
import { AccountSection } from '@/components/account/AccountSection'
import { PreferenceChoice, PreferenceToggle } from '@/components/settings/PreferenceToggle'
import { Button } from '@/components/ui/button'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'
import { getApiErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import { sendSampleSummary } from '@/services/emailService'
import type { EmailMode, PortalPreferences } from '@/types/portalPreferences'

const items: { key: keyof PortalPreferences['notifications']; label: string; description: string }[] = [
  { key: 'announcements', label: 'Announcements', description: 'Receive announcement notifications.' },
  { key: 'hr', label: 'HR', description: 'Receive HR-related portal notifications.' },
  { key: 'it', label: 'IT', description: 'Receive IT/helpdesk notifications.' },
  { key: 'requests', label: 'Requests', description: 'Receive request status notifications.' },
  { key: 'events', label: 'Events', description: 'Receive event/calendar notifications.' },
  { key: 'documents', label: 'Documents', description: 'Receive document/resource notifications.' },
]

/** Portal notification switches. They control what the portal shows; they are not external communication settings. */
export function NotificationPreferences() {
  const { preferences, update } = usePortalPreferences()
  const [sample, setSample] = useState<{ state: 'idle' | 'sending' | 'sent' | 'error'; text?: string }>({ state: 'idle' })

  const sendSample = async () => {
    setSample({ state: 'sending' })
    try {
      const result = await sendSampleSummary()
      setSample({ state: 'sent', text: `A sample was sent to ${result.sent_to}. It can take a minute to arrive; check your spam folder if it does not.` })
    } catch (error) {
      setSample({ state: 'error', text: getFieldErrors(error).email ?? (error instanceof Error && !('status' in error) ? error.message : getApiErrorMessage(error)) })
    }
  }

  return (
    <AccountSection id="notification-prefs-heading" title="Notification Preferences" description="Choose which Employee Portal notifications you see in the bell and on the Notifications page.">
      <div role="note" className="mb-3 flex items-start gap-2 border border-dashed border-muted-foreground/40 bg-white px-3 py-2 text-xs text-foreground/80">
        <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p>
          <span className="font-semibold text-foreground">Portal notifications only.</span> These settings do not change company email, SMS, payroll or government notifications, or messages from external recruitment systems. Those are managed outside this portal.
        </p>
      </div>
      <div className="border-t border-border">
        {items.map((item) => (
          <PreferenceToggle
            key={item.key}
            label={item.label}
            description={item.description}
            checked={preferences.notifications[item.key]}
            onChange={(value) => update((p) => ({ ...p, notifications: { ...p.notifications, [item.key]: value } }))}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">System notices are always shown, and the switches above also decide what is emailed.</p>

      <div className="mt-8">
        <PreferenceChoice<EmailMode>
          name="email-mode"
          legend="Email"
          description="Also get these notifications by email, at your company email address."
          value={preferences.emailMode}
          options={[
            { value: 'daily', label: 'Daily summary', hint: 'one email each morning' },
            { value: 'instant', label: 'Instantly', hint: 'an email for each one' },
            { value: 'off', label: 'No email' },
          ]}
          onChange={(emailMode) => update((p) => ({ ...p, emailMode }))}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          The daily summary arrives at 7:30 am and only when there is something to tell you: policies to read, requests waiting for your review, new notifications, and today&apos;s celebrations.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" className="bg-white" disabled={sample.state === 'sending'} onClick={() => void sendSample()}>
            <Mail aria-hidden="true" /> {sample.state === 'sending' ? 'Sending…' : 'Email me a sample'}
          </Button>
          {sample.text && <p role={sample.state === 'error' ? 'alert' : 'status'} className={`text-sm ${sample.state === 'error' ? 'text-destructive' : 'text-emerald-800'}`}>{sample.text}</p>}
        </div>
      </div>
    </AccountSection>
  )
}

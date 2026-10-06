import { useState } from 'react'
import { KeyRound, LogOut } from 'lucide-react'
import { AccountSection } from '@/components/account/AccountSection'
import { Button } from '@/components/ui/button'
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm'
import { useSignOut } from '@/auth/useSignOut'
import { isApiMode } from '@/services/dataMode'

const rows = [
  { title: 'Authentication', text: "Multi-factor authentication will be available when connected to the company's authentication system." },
  { title: 'Sessions', text: 'A list of your signed-in devices is not available yet. Changing your password signs out every other device.' },
]

/**
 * Account security. Changing your password happens here (the server checks the current password); multi-factor sign-in and a
 * device list are not built yet. Sign Out ends the session through the auth service.
 */
export function AccountSecurity() {
  const { signOut, signingOut } = useSignOut()
  const [changing, setChanging] = useState(false)

  return (
    <AccountSection id="security-heading" title="Account Security" description="Change your password here. Multi-factor sign-in is not available yet.">
      <div className="divide-y border bg-white">
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Password</p>
              <p className="text-sm text-muted-foreground">{isApiMode ? 'Choose a new password for your account.' : 'Changing a password needs the portal server and is not available in this development build.'}</p>
            </div>
            {!changing && (
              <Button variant="outline" size="sm" className="bg-white" disabled={!isApiMode} onClick={() => setChanging(true)}>
                <KeyRound aria-hidden="true" /> Change password
              </Button>
            )}
          </div>
          {changing && <div className="mt-4"><ChangePasswordForm onDone={() => setChanging(false)} /></div>}
        </div>
        {rows.map((r) => (
          <div key={r.title} className="px-4 py-3">
            <p className="text-sm font-semibold text-primary">
              {r.title} <span className="ml-1 text-xs font-normal text-muted-foreground">(unavailable)</span>
            </p>
            <p className="text-sm text-muted-foreground">{r.text}</p>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-primary">Sign Out</p>
            <p className="text-sm text-muted-foreground">End your session on this device.</p>
          </div>
          <Button variant="outline" size="sm" className="bg-white" disabled={signingOut} onClick={() => void signOut()}>
            <LogOut aria-hidden="true" /> {signingOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </div>
    </AccountSection>
  )
}

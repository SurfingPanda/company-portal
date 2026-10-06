import { useState } from 'react'
import { AccountSection } from '@/components/account/AccountSection'
import { Button } from '@/components/ui/button'
import { clearStoredRecentSearches } from '@/hooks/useRecentSearches'

/** Privacy: clear remembered searches, and an honest note about where preferences live. */
export function PrivacyPreferences({ persisted }: { persisted: boolean }) {
  const [cleared, setCleared] = useState(false)

  return (
    <AccountSection id="privacy-heading" title="Privacy" description="Controls for information kept in this browser.">
      <div className="border-b border-border py-3">
        <p className="text-sm font-medium text-foreground">Search History</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Removes the recent searches this browser remembers for the portal search.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-white"
            onClick={() => {
              clearStoredRecentSearches()
              setCleared(true)
            }}
          >
            Clear Recent Searches
          </Button>
          <p role="status" className="text-sm font-medium text-primary">
            {cleared && 'Recent searches cleared.'}
          </p>
        </div>
      </div>
      <div className="py-3">
        <p className="text-sm font-medium text-foreground">Remember Portal Preferences</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Portal preferences are stored locally in this browser for the current version of the portal. They are not sent to a server, and they contain no passwords or personal details.
          {!persisted && ' Browser storage is unavailable, so your changes last only until you close or reload this page.'}
        </p>
      </div>
    </AccountSection>
  )
}

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { clearStoredRecentSearches } from '@/hooks/useRecentSearches'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'

/** Confirms, then restores the default portal preferences. The profile, requests and notifications are not touched. */
export function ResetPreferencesDialog() {
  const { reset } = usePortalPreferences()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" className="bg-white" onClick={() => setOpen(true)}>
        Reset Preferences
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Preferences</DialogTitle>
            <DialogDescription>Reset your portal preferences to the default settings? Your profile, requests and notifications are not affected.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                reset()
                // Defaults turn search memory on; start it clean.
                clearStoredRecentSearches()
                setOpen(false)
              }}
            >
              Reset Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** What will happen and to which record. */
  children: ReactNode
  /** Say plainly whether it can be undone. */
  reversible: boolean
  confirmLabel: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation for destructive or security-sensitive actions (disable a user, delete content, remove a role…). It names the
 * effect, the record and whether the action can be reversed. An accessible dialog, never `window.confirm`.
 */
export function ConfirmDialog({ open, title, children, reversible, confirmLabel, busy, error, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-foreground/85">
              <div>{children}</div>
              <p className="font-medium">{reversible ? 'This can be undone later.' : 'This cannot be undone.'}</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={busy} className={reversible ? '' : 'bg-destructive text-white hover:bg-destructive/90'}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

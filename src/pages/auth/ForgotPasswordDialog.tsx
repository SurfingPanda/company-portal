import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useMutation } from '@/hooks/useMutation'
import { AUTH_MODE, requestPasswordReset } from '@/services/authService'

/** "Forgot your password?": asks for the employee ID or email and has the portal email a one-time link. */
export function ForgotPasswordDialog({ open, onOpenChange, firstTime = false }: { open: boolean; onOpenChange: (open: boolean) => void; firstTime?: boolean }) {
  const [identifier, setIdentifier] = useState('')
  const [sent, setSent] = useState(false)
  const send = useMutation((value: string) => requestPasswordReset(value))

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setSent(false)
      setIdentifier('')
      send.reset()
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) return
    if (await send.mutate(identifier.trim())) setSent(true)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{firstTime ? 'First time signing in?' : 'Forgot your password?'}</DialogTitle>
          <DialogDescription>
            {AUTH_MODE !== 'api'
              ? 'Password recovery needs the Employee Portal server. It is not available in this development build.'
              : sent
                ? 'If an account matches, an email with a link to choose your password is on its way. The link works once and expires after a short time.'
                : firstTime
                  ? 'Enter your company email. We will email you a link to choose your own password, then you can sign in.'
                  : 'Enter your employee ID or company email. We will email you a link to choose a new password.'}
          </DialogDescription>
        </DialogHeader>
        {AUTH_MODE === 'api' && !sent && (
          <form onSubmit={submit} noValidate className="space-y-3">
            <label htmlFor="forgot-identifier" className="block text-sm font-medium">Employee ID or Company Email</label>
            <Input id="forgot-identifier" value={identifier} autoComplete="username" autoFocus disabled={send.submitting} onChange={(e) => setIdentifier(e.target.value)} className="h-10" />
            {send.error && <p role="alert" className="text-sm font-medium text-destructive">{send.error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => close(false)}>Cancel</Button>
              <Button type="submit" disabled={send.submitting || !identifier.trim()}>{send.submitting ? 'Sending…' : firstTime ? 'Email me the link' : 'Send reset link'}</Button>
            </DialogFooter>
          </form>
        )}
        {(AUTH_MODE !== 'api' || sent) && (
          <DialogFooter>
            <Button onClick={() => close(false)}>Close</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

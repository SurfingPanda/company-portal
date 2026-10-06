import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Wordmark } from '@/components/common/Wordmark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMutation } from '@/hooks/useMutation'
import { AUTH_MODE, setPasswordFromLink } from '@/services/authService'

const MIN_LENGTH = 12

/** Where the emailed activation / reset link lands: choose a password, then go sign in. */
export default function SetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [show, setShow] = useState(false)
  const [clientError, setClientError] = useState<string>()
  const [done, setDone] = useState(false)
  const save = useMutation((_: void) => setPasswordFromLink(token, password, confirmation))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setClientError(undefined)
    if (password.length < MIN_LENGTH) return setClientError(`Use at least ${MIN_LENGTH} characters.`)
    if (password !== confirmation) return setClientError('The two passwords do not match.')
    if (await save.mutate()) setDone(true)
  }

  const linkProblem = token.length !== 64 || save.fieldErrors.token
  const error = clientError ?? save.fieldErrors.password ?? (!save.fieldErrors.token ? save.error : undefined)
  const strength = password.length === 0 ? '' : password.length < MIN_LENGTH ? `${MIN_LENGTH - password.length} more characters needed` : 'Length is fine'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050c27] px-4 py-10">
      <div className="w-full max-w-md border-t-4 border-t-emerald-700 bg-white p-8 shadow-xl">
        <Wordmark className="mb-6 h-9" />
        <h1 className="font-serif text-2xl font-semibold text-primary">Choose your password</h1>

        {AUTH_MODE !== 'api' ? (
          <p className="mt-3 text-sm text-muted-foreground">This needs the Employee Portal server and is not available in this development build.</p>
        ) : done ? (
          <>
            <p role="status" className="mt-4 border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">Your password is set. You can sign in now.</p>
            <Button asChild className="mt-5 w-full"><Link to="/login">Go to sign in</Link></Button>
          </>
        ) : linkProblem ? (
          <>
            <p role="alert" className="mt-4 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {save.fieldErrors.token ?? 'This link is incomplete. Open the link from your email again.'}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Use &quot;Forgot your password?&quot; on the sign-in page to get a new link, or ask an administrator to resend it.</p>
            <Button asChild variant="outline" className="mt-5 w-full"><Link to="/login">Back to sign in</Link></Button>
          </>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Pick a password you do not use anywhere else. At least {MIN_LENGTH} characters; a few random words work well.</p>
            {error && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium">New password</label>
              <div className="relative">
                <Lock aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="new-password" type={show ? 'text' : 'password'} autoComplete="new-password" autoFocus value={password} disabled={save.submitting} onChange={(e) => setPassword(e.target.value)} className="h-11 bg-white px-9" aria-describedby="pw-hint" />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p id="pw-hint" className="mt-1 text-xs text-muted-foreground" aria-live="polite">{strength}</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium">Repeat the password</label>
              <Input id="confirm-password" type={show ? 'text' : 'password'} autoComplete="new-password" value={confirmation} disabled={save.submitting} onChange={(e) => setConfirmation(e.target.value)} className="h-11 bg-white" />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={save.submitting}>{save.submitting ? 'Saving…' : 'Set password'}</Button>
          </form>
        )}
      </div>
    </main>
  )
}

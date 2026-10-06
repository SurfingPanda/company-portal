import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Wordmark } from '@/components/common/Wordmark'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { ForgotPasswordDialog } from '@/pages/auth/ForgotPasswordDialog'
import { getApiErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import { AuthError, identifyAccount } from '@/services/authService'
import { authErrorMessages } from '@/types/auth'
import { cn } from '@/lib/utils'

const IDENTIFIER_REQUIRED = 'Employee ID or company email is required.'
const PASSWORD_REQUIRED = 'Password is required.'
const MIN_PASSWORD = 12

/** Existing portal areas, listed plainly. Not marketing copy: just where the portal leads. */
const accessIndex = ['Documents & Resources', 'Forms & Requests', 'Employee Services', 'Employee Directory', 'Company Calendar', 'IT Helpdesk']

/**
 * Decorative backdrop: fine concentric rings that draw themselves in, a dotted ring and one accent arc that turn very slowly,
 * and a dot grid that fades out. Pure SVG/CSS, hidden from assistive technology, and still when reduced motion is on.
 */
function Backdrop() {
  const rings = [220, 330, 440, 560, 690, 830]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_90%,rgba(40,62,140,0.35),transparent_60%)]" />
      <div className="login-fade absolute inset-0 opacity-60 [--d:0.4s] [background-image:radial-gradient(rgba(255,255,255,0.13)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:linear-gradient(115deg,black,transparent_62%)]" />
      <svg className="absolute -bottom-[10%] -left-[12%] h-[120%] w-auto max-w-none" viewBox="0 0 1000 1000" fill="none" preserveAspectRatio="xMinYMax meet">
        <g stroke="white" strokeOpacity="0.09" strokeWidth="1" vectorEffect="non-scaling-stroke">
          {rings.map((r, i) => (
            <circle key={r} cx="260" cy="760" r={r} pathLength={1} className="login-ring" style={{ ['--d' as string]: `${0.3 + i * 0.28}s` }} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <g className="login-orbit" style={{ ['--t' as string]: '200s' }}>
          <circle cx="260" cy="760" r="625" stroke="white" strokeOpacity="0.2" strokeWidth="3" strokeDasharray="1.5 16" vectorEffect="non-scaling-stroke" />
        </g>
        <g className="login-orbit" style={{ ['--t' as string]: '90s' }}>
          <circle cx="260" cy="760" r="440" stroke="#46c35c" strokeOpacity="0.85" strokeWidth="2" pathLength={1} strokeDasharray="0.09 0.91" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
    </div>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1 text-sm font-medium text-destructive">
      <span aria-hidden="true">⚠ </span>
      {message}
    </p>
  )
}

/**
 * Sign-in page: the entrance to the Employee Portal, with its own layout (no portal navigation). Sign-in has three stages:
 *   identify  the person types only their employee ID or company email;
 *   password  an existing account asks for its password (useAuth().login());
 *   setup     a first-time account gets a 6-digit code by email, enters it, chooses a password and is signed in
 *             (useAuth().firstSignIn()); the route guard then sends them on to the onboarding.
 * This page is UI only; see services/authService.ts.
 */
type Stage = 'identify' | 'password' | 'setup'

export default function LoginPage() {
  const { login, firstSignIn } = useAuth()

  const [stage, setStage] = useState<Stage>('identify')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [setupInfo, setSetupInfo] = useState<{ emailHint: string; codeMinutes: number }>()
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [notice, setNotice] = useState<string>()
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; code?: string; newPassword?: string; confirmation?: string }>({})
  const [failure, setFailure] = useState<string>()
  const [failCount, setFailCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const previous = document.title
    document.title = 'Sign In | ELJIN CORPORATION Employee Portal'
    return () => {
      document.title = previous
    }
  }, [])

  const failed = (message: string) => {
    setFailure(message)
    setFailCount((n) => n + 1)
    setSubmitting(false)
    requestAnimationFrame(() => alertRef.current?.focus())
  }

  const backToIdentify = () => {
    setStage('identify')
    setPassword('')
    setCode('')
    setNewPassword('')
    setConfirmation('')
    setShowPassword(false)
    setErrors({})
    setFailure(undefined)
    setNotice(undefined)
    requestAnimationFrame(() => document.getElementById('login-identifier')?.focus())
  }

  /** Stage 1 (and "send a new code"): ask the server what this account needs next. */
  const identify = async (resend = false) => {
    setFailure(undefined)
    setNotice(undefined)
    if (!identifier.trim()) {
      setErrors({ identifier: IDENTIFIER_REQUIRED })
      document.getElementById('login-identifier')?.focus()
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const result = await identifyAccount(identifier.trim())
      setSubmitting(false)
      if (result.step === 'setup') {
        setSetupInfo({ emailHint: result.emailHint, codeMinutes: result.codeMinutes })
        setStage('setup')
        if (resend) setNotice('If a new code was due, it is on its way. Codes can be re-sent once a minute.')
        requestAnimationFrame(() => codeRef.current?.focus())
      } else {
        setStage('password')
        requestAnimationFrame(() => passwordRef.current?.focus())
      }
    } catch (error) {
      failed(authErrorMessages[error instanceof AuthError ? error.kind : 'server'])
    }
  }

  /** Stage 2: an existing account signs in with its password. */
  const signIn = async () => {
    setFailure(undefined)
    if (!password) {
      setErrors({ password: PASSWORD_REQUIRED })
      passwordRef.current?.focus()
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await login({ identifier: identifier.trim(), password, rememberMe: remember })
      // Signed in: the route guard on /login sends the employee to the onboarding, their returnUrl (validated) or the dashboard.
      return
    } catch (error) {
      // Coarse, user-safe message only. Never says whether the ID/email exists or which part was wrong.
      setPassword('')
      setShowPassword(false)
      failed(authErrorMessages[error instanceof AuthError ? error.kind : 'server'])
    }
  }

  /** Stage 2 for a first-time account: emailed code + a password of their own choosing. */
  const setUp = async () => {
    setFailure(undefined)
    const found = {
      code: /^\d{6}$/.test(code.trim()) ? undefined : 'Enter the 6-digit code from your email.',
      newPassword: newPassword.length >= MIN_PASSWORD ? undefined : `Use at least ${MIN_PASSWORD} characters.`,
      confirmation: newPassword === confirmation ? undefined : 'The two passwords do not match.',
    }
    setErrors(found)
    if (found.code || found.newPassword || found.confirmation) {
      document.getElementById(found.code ? 'login-code' : found.newPassword ? 'login-new-password' : 'login-confirmation')?.focus()
      return
    }
    setSubmitting(true)
    try {
      await firstSignIn({ identifier: identifier.trim(), code: code.trim(), password: newPassword, passwordConfirmation: confirmation })
    } catch (error) {
      const fields = getFieldErrors(error)
      setErrors({ code: fields.code, newPassword: fields.password })
      if (fields.code) codeRef.current?.focus()
      failed(fields.code || fields.password ? 'Please fix the highlighted field.' : getApiErrorMessage(error))
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (stage === 'identify') void identify()
    else if (stage === 'password') void signIn()
    else void setUp()
  }

  const inputClass = 'h-11 bg-white pl-10'
  const heading = stage === 'setup' ? 'Set up your password' : stage === 'password' ? 'Welcome Back' : 'Welcome Back'
  const subheading =
    stage === 'identify'
      ? 'Enter your employee ID or company email to continue.'
      : stage === 'password'
        ? 'Enter your password to sign in.'
        : `This is your first time signing in. We emailed a 6-digit code to ${setupInfo?.emailHint}. It expires in ${setupInfo?.codeMinutes} minutes.`
  const buttonLabel = stage === 'identify' ? 'Continue' : stage === 'password' ? 'Sign In' : 'Set password & sign in'
  const busyLabel = stage === 'identify' ? 'Checking...' : stage === 'password' ? 'Signing in...' : 'Setting up...'

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((s) => !s)}
      disabled={submitting}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      aria-pressed={showPassword}
      className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
    >
      {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
    </button>
  )

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-navy-deep text-on-navy">
      <Backdrop />

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_26.5rem] lg:gap-20 lg:py-12">
        {/* Brand and access index */}
        <section aria-label="ELJIN CORPORATION Employee Portal" className="min-w-0">
          <div className="login-rise flex items-center gap-4">
            <Wordmark inverted className="h-10 lg:h-14" />
          </div>
          <div className="login-rise mt-5 lg:mt-12" style={{ ['--d' as string]: '0.12s' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-on-navy/70">ELJIN CORPORATION</p>
            <p className="mt-2 font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Employee Portal</p>
            <span className="login-grow mt-4 block h-0.5 w-16 bg-gold [--d:0.5s]" />
            <p className="mt-4 hidden max-w-md text-[0.9375rem] leading-relaxed text-on-navy/75 sm:block">
              Your central access point for employee services, company resources, forms, documents, and support.
            </p>
          </div>

          <ol aria-label="Portal areas" className="mt-10 hidden max-w-sm lg:block">
            {accessIndex.map((item, i) => (
              <li key={item} className="login-rise flex items-baseline gap-4 border-t border-on-navy/15 py-2.5 last:border-b" style={{ ['--d' as string]: `${0.55 + i * 0.09}s` }}>
                <span className="font-mono text-[0.6875rem] tabular-nums text-gold">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-sm text-on-navy/85">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Sign-in card */}
        <main className="login-rise w-full" style={{ ['--d' as string]: '0.25s' }}>
          <div className={cn('relative overflow-hidden border border-white/10 bg-white text-foreground shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]', failCount > 0 && 'login-shake')} key={failCount}>
            {/* Top rule: draws in once, and becomes an indeterminate progress sweep while working. */}
            <div className="relative h-[3px] bg-border" aria-hidden="true">
              {submitting ? <span className="login-progress absolute inset-y-0 left-0 w-1/3 bg-gold" /> : <span className="login-grow absolute inset-0 bg-gold [--d:0.6s]" />}
            </div>

            <div className="p-6 sm:p-8">
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary">{heading}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{subheading}</p>

              <form onSubmit={handleSubmit} noValidate aria-label="Sign in" aria-busy={submitting} className="mt-6 space-y-5">
                {failure && (
                  <div ref={alertRef} tabIndex={-1} role="alert" className="border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm font-medium text-destructive focus-visible:outline-2 focus-visible:outline-ring">
                    {failure}
                  </div>
                )}
                {notice && <p role="status" className="border border-emerald-700/40 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">{notice}</p>}

                {stage === 'identify' ? (
                  <div>
                    <label htmlFor="login-identifier" className="mb-1.5 block text-sm font-medium">
                      Employee ID or Company Email
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      <Input
                        id="login-identifier"
                        name="username"
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        autoFocus
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value)
                          if (errors.identifier) setErrors((p) => ({ ...p, identifier: undefined }))
                        }}
                        placeholder="Enter your employee ID or company email"
                        disabled={submitting}
                        aria-invalid={Boolean(errors.identifier)}
                        aria-describedby={errors.identifier ? 'login-identifier-error' : undefined}
                        className={cn(inputClass, errors.identifier && 'border-destructive')}
                      />
                    </div>
                    <FieldError id="login-identifier-error" message={errors.identifier} />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 border bg-muted/40 px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <User className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate font-medium">{identifier.trim()}</span>
                    </span>
                    <button type="button" onClick={backToIdentify} disabled={submitting} className="shrink-0 text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                      Not you?
                    </button>
                  </div>
                )}

                {stage === 'password' && (
                  <>
                    <div>
                      <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <Input
                          ref={passwordRef}
                          id="login-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                          }}
                          placeholder="Enter your password"
                          disabled={submitting}
                          aria-invalid={Boolean(errors.password)}
                          aria-describedby={errors.password ? 'login-password-error' : undefined}
                          className={cn(inputClass, 'pr-11', errors.password && 'border-destructive')}
                        />
                        {passwordToggle}
                      </div>
                      <FieldError id="login-password-error" message={errors.password} />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="login-remember" checked={remember} onCheckedChange={(c) => setRemember(c === true)} disabled={submitting} />
                        <label htmlFor="login-remember" className="text-sm">
                          Remember me
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForgotOpen(true)}
                        className="text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </>
                )}

                {stage === 'setup' && (
                  <>
                    <div>
                      <label htmlFor="login-code" className="mb-1.5 block text-sm font-medium">
                        6-digit code from your email
                      </label>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <Input
                          ref={codeRef}
                          id="login-code"
                          name="one-time-code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={code}
                          onChange={(e) => {
                            setCode(e.target.value.replace(/\D/g, ''))
                            if (errors.code) setErrors((p) => ({ ...p, code: undefined }))
                          }}
                          placeholder="123456"
                          disabled={submitting}
                          aria-invalid={Boolean(errors.code)}
                          aria-describedby={errors.code ? 'login-code-error' : undefined}
                          className={cn(inputClass, 'font-mono tracking-[0.3em]', errors.code && 'border-destructive')}
                        />
                      </div>
                      <FieldError id="login-code-error" message={errors.code} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Didn&apos;t get it?{' '}
                        <button type="button" onClick={() => void identify(true)} disabled={submitting} className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                          Send a new code
                        </button>
                      </p>
                    </div>

                    <div>
                      <label htmlFor="login-new-password" className="mb-1.5 block text-sm font-medium">
                        Choose a password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <Input
                          id="login-new-password"
                          name="new-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value)
                            if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: undefined }))
                          }}
                          disabled={submitting}
                          aria-invalid={Boolean(errors.newPassword)}
                          aria-describedby="login-new-password-hint"
                          className={cn(inputClass, 'pr-11', errors.newPassword && 'border-destructive')}
                        />
                        {passwordToggle}
                      </div>
                      <FieldError id="login-new-password-error" message={errors.newPassword} />
                      <p id="login-new-password-hint" className="mt-1 text-xs text-muted-foreground">At least {MIN_PASSWORD} characters. A few random words work well.</p>
                    </div>

                    <div>
                      <label htmlFor="login-confirmation" className="mb-1.5 block text-sm font-medium">
                        Confirm password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <Input
                          id="login-confirmation"
                          name="confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={confirmation}
                          onChange={(e) => {
                            setConfirmation(e.target.value)
                            if (errors.confirmation) setErrors((p) => ({ ...p, confirmation: undefined }))
                          }}
                          disabled={submitting}
                          aria-invalid={Boolean(errors.confirmation)}
                          className={cn(inputClass, errors.confirmation && 'border-destructive')}
                        />
                      </div>
                      <FieldError id="login-confirmation-error" message={errors.confirmation} />
                    </div>
                  </>
                )}

                <Button type="submit" disabled={submitting} className="group h-11 w-full">
                  {submitting ? busyLabel : buttonLabel}
                  {!submitting && <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden="true" />}
                </Button>
              </form>
              <p role="status" aria-live="polite" className="sr-only">
                {submitting ? busyLabel : ''}
              </p>
            </div>
          </div>
          <p className="login-fade mt-4 text-center text-xs text-on-navy/65 [--d:1.1s]">For authorized employees only.</p>
        </main>
      </div>

      <footer className="relative px-5 py-4 text-center text-xs text-on-navy/55">
        <span>© 2026 ELJIN CORPORATION • Employee Portal</span>
        <span aria-hidden="true"> • </span>
        <Link to="/help" className="underline-offset-4 hover:text-on-navy hover:underline focus-visible:text-on-navy focus-visible:outline-2 focus-visible:outline-on-navy">
          Help
        </Link>
      </footer>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </div>
  )
}

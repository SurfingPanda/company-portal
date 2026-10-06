import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMutation } from '@/hooks/useMutation'
import { changePassword } from '@/services/accountService'

const MIN_LENGTH = 12

interface Values {
  current: string
  next: string
  confirmation: string
}

/** Change your own password. The current one is asked for; afterwards other devices are signed out. */
export function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [values, setValues] = useState<Values>({ current: '', next: '', confirmation: '' })
  const [show, setShow] = useState(false)
  const [clientErrors, setClientErrors] = useState<Partial<Record<keyof Values, string>>>({})
  const [done, setDone] = useState<string>()
  const save = useMutation((v: Values) => changePassword(v.current, v.next, v.confirmation))

  const set = (key: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (clientErrors[key]) setClientErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found: Partial<Record<keyof Values, string>> = {}
    if (!values.current) found.current = 'Enter your current password.'
    if (values.next.length < MIN_LENGTH) found.next = `Use at least ${MIN_LENGTH} characters.`
    else if (values.next === values.current) found.next = 'Choose a password you have not been using.'
    if (values.confirmation !== values.next) found.confirmation = 'The two new passwords do not match.'
    setClientErrors(found)
    const first = (['current', 'next', 'confirmation'] as const).find((k) => found[k])
    if (first) {
      document.getElementById(`cp-${first}`)?.focus()
      return
    }
    const result = await save.mutate(values)
    if (result) {
      setDone(result.message)
      setValues({ current: '', next: '', confirmation: '' })
    }
  }

  const error = (key: keyof Values) => clientErrors[key] ?? (key === 'current' ? save.fieldErrors.current_password : key === 'next' ? save.fieldErrors.password : undefined)
  const generic = Object.keys(save.fieldErrors).length === 0 ? save.error : null

  if (done) {
    return (
      <div className="space-y-3">
        <p role="status" className="border border-emerald-700/40 bg-emerald-50 p-3 text-sm text-emerald-900">{done} We also sent a notice to your email.</p>
        <Button type="button" variant="outline" size="sm" className="bg-white" onClick={onDone}>Done</Button>
      </div>
    )
  }

  const field = (key: keyof Values, label: string, autoComplete: string, hint?: string) => (
    <div>
      <label htmlFor={`cp-${key}`} className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={`cp-${key}`}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={values[key]}
          disabled={save.submitting}
          aria-invalid={Boolean(error(key))}
          aria-describedby={error(key) ? `cp-${key}-error` : hint ? `cp-${key}-hint` : undefined}
          onChange={(e) => set(key, e.target.value)}
          className={`h-10 bg-white pl-9 ${error(key) ? 'border-destructive' : ''}`}
        />
      </div>
      {error(key) ? <p id={`cp-${key}-error`} className="mt-1 text-sm font-medium text-destructive">{error(key)}</p> : hint ? <p id={`cp-${key}-hint`} className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )

  return (
    <form onSubmit={(e) => void submit(e)} noValidate aria-label="Change password" className="max-w-md space-y-4">
      {generic && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{generic}</p>}
      {field('current', 'Current password', 'current-password')}
      {field('next', 'New password', 'new-password', `At least ${MIN_LENGTH} characters. A few random words work well.`)}
      {field('confirmation', 'Confirm new password', 'new-password')}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-4 accent-[var(--primary)]" />
        {show ? <EyeOff className="size-4 text-muted-foreground" aria-hidden="true" /> : <Eye className="size-4 text-muted-foreground" aria-hidden="true" />}
        Show passwords
      </label>
      <p className="text-xs text-muted-foreground">When you change it, you stay signed in here and every other device is signed out.</p>
      <div className="flex gap-3">
        <Button type="submit" disabled={save.submitting}>{save.submitting ? 'Changing…' : 'Change password'}</Button>
        <Button type="button" variant="outline" className="bg-white" disabled={save.submitting} onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

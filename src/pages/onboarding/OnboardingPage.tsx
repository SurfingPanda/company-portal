import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Wordmark } from '@/components/common/Wordmark'
import { EmergencyContactsEditor, PersonalDetailsFields, type PersonalErrors } from '@/components/profile/PersonalInfoFields'
import { NotificationPreferences } from '@/components/settings/NotificationPreferences'
import { PreferenceChoice } from '@/components/settings/PreferenceToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'
import { formatDate } from '@/lib/format'
import { getApiErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import { cleanContacts, isCompleteContact } from '@/lib/personalInfo'
import { validateProfile, type ProfileErrors, type ProfileFormValues } from '@/lib/profileValidation'
import { employmentStatusLabels, getUserDisplayName } from '@/lib/user'
import { completeOnboarding } from '@/services/authService'
import { EMPTY_PERSONAL_INFO, getPersonalInfo, savePersonalInfo } from '@/services/personalInfoService'
import type { PersonalInfo } from '@/types/personalInfo'
import type { ThemePreference } from '@/types/portalPreferences'

const STEPS = ['Welcome', 'Your details', 'About you', 'Emergency contact', 'Preferences', 'Finish'] as const

const features = [
  ['Announcements and the company calendar', 'Stay current with company news and events.'],
  ['Forms and requests', 'File leave and other HR requests and follow their status.'],
  ['Documents and the employee directory', 'Find policies, forms and your colleagues.'],
  ['IT helpdesk', 'Open a ticket when something needs fixing.'],
]

/**
 * First sign-in setup. A new account is sent here until the setup is finished (see ProtectedRoute): welcome, check the
 * details HR holds, tell us about yourself (contact and personal details, optional), give at least one emergency contact
 * (required: the server refuses to finish without one), choose preferences. Finishing marks the setup done on the server
 * so it is not shown again.
 */
export default function OnboardingPage() {
  const { user, updateProfile, refreshUser, logout } = useAuth()
  const { preferences, update } = usePortalPreferences()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<ProfileFormValues>({
    preferredName: user?.preferredName ?? '',
    personalEmail: user?.personalEmail ?? '',
    mobileNumber: user?.mobileNumber ?? '',
  })
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [personal, setPersonal] = useState<PersonalInfo>(EMPTY_PERSONAL_INFO)
  const [personalErrors, setPersonalErrors] = useState<PersonalErrors>({})
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string>()

  // Someone who reloads the page part-way through sees what they already saved.
  useEffect(() => {
    void getPersonalInfo().then(setPersonal, () => undefined)
  }, [])

  if (!user) return null
  const first = getUserDisplayName(user)
  const last = step === STEPS.length - 1

  const setField = (key: keyof ProfileFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const saveContact = async (): Promise<boolean> => {
    const found = validateProfile(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return false
    const changes = {
      preferredName: values.preferredName.trim() || undefined,
      personalEmail: values.personalEmail.trim() || undefined,
      mobileNumber: values.mobileNumber.trim() || undefined,
    }
    const unchanged = changes.preferredName === user.preferredName && changes.personalEmail === user.personalEmail && changes.mobileNumber === user.mobileNumber
    if (unchanged) return true
    setBusy(true)
    setFailure(undefined)
    try {
      await updateProfile(changes)
      return true
    } catch (error) {
      setErrors(getFieldErrors(error, { preferred_name: 'preferredName', personal_email: 'personalEmail', mobile_number: 'mobileNumber' }))
      setFailure(getApiErrorMessage(error))
      return false
    } finally {
      setBusy(false)
    }
  }

  /** Saves the personal details (everything except the emergency contacts). */
  const saveDetails = async (): Promise<boolean> => {
    const { emergency_contacts: _ignored, ...details } = personal
    void _ignored
    setBusy(true)
    setFailure(undefined)
    try {
      setPersonal(await savePersonalInfo(details))
      setPersonalErrors({})
      return true
    } catch (error) {
      setPersonalErrors(getFieldErrors(error))
      setFailure(getApiErrorMessage(error))
      return false
    } finally {
      setBusy(false)
    }
  }

  /** The emergency contacts are required: at least one with a name, a relationship and a phone number. */
  const saveContacts = async (): Promise<boolean> => {
    const contacts = cleanContacts(personal.emergency_contacts)
    if (contacts.length === 0 || !contacts.every(isCompleteContact)) {
      setPersonalErrors({ emergency_contacts: contacts.length === 0 ? 'Add at least one emergency contact.' : 'Each contact needs a name, a relationship and a phone number.' })
      return false
    }
    setBusy(true)
    setFailure(undefined)
    try {
      setPersonal(await savePersonalInfo({ emergency_contacts: contacts }))
      setPersonalErrors({})
      return true
    } catch (error) {
      setPersonalErrors(getFieldErrors(error))
      setFailure(getApiErrorMessage(error))
      return false
    } finally {
      setBusy(false)
    }
  }

  const next = async () => {
    if (step === 2 && !((await saveContact()) && (await saveDetails()))) return
    if (step === 3 && !(await saveContacts())) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const finish = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setFailure(undefined)
    try {
      await completeOnboarding()
      await refreshUser()
      navigate('/', { replace: true })
    } catch (error) {
      setFailure(getApiErrorMessage(error))
      setBusy(false)
    }
  }

  const details: [string, string | undefined][] = [
    ['Employee ID', user.employeeId],
    ['Job title', user.jobTitle],
    ['Department', user.departmentName],
    ['Location', user.location],
    ['Manager', user.managerName],
    ['Date joined', user.dateJoined ? formatDate(user.dateJoined, 'long') : undefined],
    ['Employment status', employmentStatusLabels[user.employmentStatus]],
    ['Company email', user.workEmail],
  ]

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050c27] px-4 py-10">
      <div className="w-full max-w-2xl border-t-4 border-t-gold bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <Wordmark className="h-9" />
          <button type="button" onClick={() => void logout()} className="text-xs text-muted-foreground underline-offset-4 hover:underline">Sign out</button>
        </div>

        <ol aria-label="Setup progress" className="mt-6 flex gap-1.5">
          {STEPS.map((name, i) => (
            <li key={name} className="flex-1" aria-current={i === step ? 'step' : undefined}>
              <span className={`block h-1 ${i <= step ? 'bg-primary' : 'bg-border'}`} aria-hidden="true" />
              <span className={`mt-1 block text-[0.6875rem] font-medium ${i === step ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}. {name}</span>
            </li>
          ))}
        </ol>

        <form onSubmit={finish} noValidate className="mt-6">
          {failure && <p role="alert" className="mb-4 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{failure}</p>}

          {step === 0 && (
            <section aria-labelledby="ob-h0">
              <h1 id="ob-h0" className="font-serif text-2xl font-semibold text-primary">Welcome, {first}</h1>
              <p className="mt-2 text-sm text-foreground/85">Let&apos;s get your Employee Portal ready. It takes about a minute, and you can change everything later in your profile and account settings.</p>
              <ul className="mt-4 divide-y border">
                {features.map(([title, text]) => (
                  <li key={title} className="px-4 py-3">
                    <p className="text-sm font-semibold text-primary">{title}</p>
                    <p className="text-xs text-muted-foreground">{text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {step === 1 && (
            <section aria-labelledby="ob-h1">
              <h2 id="ob-h1" className="font-serif text-2xl font-semibold text-primary">Check your details</h2>
              <p className="mt-2 text-sm text-foreground/85">This is what HR has on record for you. You can&apos;t edit it yourself.</p>
              <dl className="mt-4 border">
                {details.map(([label, value]) => (
                  <div key={label} className="grid gap-0.5 border-b px-4 py-2.5 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
                    <dd className={`text-sm ${value ? '' : 'italic text-muted-foreground'}`}>{value || 'Not provided yet'}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">Something missing or wrong? Finish the setup, then send HR an employee information request from your profile.</p>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="ob-h2">
              <h2 id="ob-h2" className="font-serif text-2xl font-semibold text-primary">Tell us about you</h2>
              <p className="mt-2 text-sm text-foreground/85">All optional. Only you and HR see these; they are not shown in the directory.</p>
              <div className="mt-4 space-y-4">
                {([
                  ['preferredName', 'Preferred name', 'text', 'How you would like to be greeted.'],
                  ['personalEmail', 'Personal email', 'email', 'Used only if the portal needs another way to reach you.'],
                  ['mobileNumber', 'Mobile number', 'tel', 'e.g. 0917 123 4567'],
                ] as const).map(([key, label, type, hint]) => (
                  <div key={key}>
                    <label htmlFor={`ob-${key}`} className="mb-1.5 block text-sm font-medium">{label} <span className="font-normal text-muted-foreground">(optional)</span></label>
                    <Input id={`ob-${key}`} type={type} value={values[key]} disabled={busy} aria-invalid={Boolean(errors[key])} aria-describedby={`ob-${key}-hint`} onChange={(e) => setField(key, e.target.value)} className={`h-10 ${errors[key] ? 'border-destructive' : ''}`} />
                    <p id={`ob-${key}-hint`} className={`mt-1 text-xs ${errors[key] ? 'text-destructive' : 'text-muted-foreground'}`}>{errors[key] ?? hint}</p>
                  </div>
                ))}
              </div>
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal details</h3>
              <div className="mt-3">
                <PersonalDetailsFields value={personal} onChange={setPersonal} errors={personalErrors} disabled={busy} idPrefix="ob-pd" />
              </div>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="ob-hec">
              <h2 id="ob-hec" className="font-serif text-2xl font-semibold text-primary">Who should we call in an emergency?</h2>
              <p className="mt-2 text-sm text-foreground/85">Add at least one person. List the person to call first at the top. Only you and HR can see this; it is never shown in the directory.</p>
              <div className="mt-4">
                <EmergencyContactsEditor contacts={personal.emergency_contacts} onChange={(emergency_contacts) => setPersonal({ ...personal, emergency_contacts })} errors={personalErrors} disabled={busy} idPrefix="ob-ec" />
              </div>
            </section>
          )}

          {step === 4 && (
            <section aria-labelledby="ob-h3">
              <h2 id="ob-h3" className="font-serif text-2xl font-semibold text-primary">Make it yours</h2>
              <p className="mt-2 text-sm text-foreground/85">Pick how the portal looks and which notifications you want. The defaults are fine if you are unsure.</p>
              <div className="mt-4">
                <PreferenceChoice<ThemePreference>
                  name="ob-theme"
                  legend="Theme"
                  description="Match your device, or choose light or dark."
                  value={preferences.appearance.theme}
                  options={[
                    { value: 'system', label: 'Match device' },
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                  ]}
                  onChange={(theme) => update((p) => ({ ...p, appearance: { ...p.appearance, theme } }))}
                />
              </div>
              <div className="mt-4"><NotificationPreferences /></div>
            </section>
          )}

          {step === 5 && (
            <section aria-labelledby="ob-h4" className="text-center">
              <CheckCircle2 className="mx-auto size-10 text-emerald-700" aria-hidden="true" />
              <h2 id="ob-h4" className="mt-3 font-serif text-2xl font-semibold text-primary">You&apos;re all set, {first}</h2>
              <p className="mt-2 text-sm text-foreground/85">Your portal is ready. You can update your contact details and preferences any time from your profile and account settings.</p>
            </section>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button type="button" variant="outline" disabled={step === 0 || busy} onClick={() => setStep((s) => Math.max(s - 1, 0))}>Back</Button>
            {last ? (
              <Button type="submit" disabled={busy}>{busy ? 'Finishing…' : 'Go to my dashboard'}</Button>
            ) : (
              <Button type="button" disabled={busy} onClick={() => void next()}>{busy ? 'Saving…' : step === 0 ? 'Get started' : 'Continue'}</Button>
            )}
          </div>
        </form>
      </div>
    </main>
  )
}

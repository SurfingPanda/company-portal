import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProfileField } from '@/components/profile/ProfileField'
import { ProfileSection } from '@/components/profile/ProfileSection'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { ProfileError, ProfileSkeleton } from '@/components/profile/ProfileStates'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { getFieldErrors } from '@/lib/apiErrors'
import { validateProfile, type ProfileErrors, type ProfileFormValues } from '@/lib/profileValidation'
import { formatDate } from '@/lib/format'
import { employmentStatusLabels, getUserFullName } from '@/lib/user'
import { cn } from '@/lib/utils'
import type { AuthenticatedUser } from '@/types/user'

function Field({ id, label, optional, error, help, children }: { id: string; label: string; optional?: boolean; error?: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {optional ? (
          <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
        ) : (
          <>
            <span aria-hidden="true" className="ml-0.5 text-destructive">*</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {children}
      {help && !error && (
        <p id={`${id}-help`} className="mt-1 text-xs text-muted-foreground">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-medium text-destructive">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  )
}

function EditForm({ user }: { user: AuthenticatedUser }) {
  const { updateProfile } = useAuth()
  const navigate = useNavigate()

  const initial: ProfileFormValues = {
    preferredName: user.preferredName ?? '',
    personalEmail: user.personalEmail ?? '',
    mobileNumber: user.mobileNumber ?? '',
  }
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Avatar: local preview only. Object URLs we create are released unless they were saved to the user.
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
  const createdUrl = useRef<string | undefined>(undefined)
  const saved = useRef(false)

  useEffect(
    () => () => {
      if (!saved.current && createdUrl.current) URL.revokeObjectURL(createdUrl.current)
    },
    [],
  )

  const selectPhoto = (file: File) => {
    if (createdUrl.current) URL.revokeObjectURL(createdUrl.current)
    createdUrl.current = URL.createObjectURL(file)
    setAvatarUrl(createdUrl.current)
  }

  const removePhoto = () => {
    if (createdUrl.current) {
      URL.revokeObjectURL(createdUrl.current)
      createdUrl.current = undefined
    }
    setAvatarUrl(undefined)
  }

  const dirty = values.preferredName !== initial.preferredName || values.personalEmail !== initial.personalEmail || values.mobileNumber !== initial.mobileNumber || avatarUrl !== user.avatarUrl

  // Warn before closing or reloading the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const setField = (key: keyof ProfileFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError(false)
    const found = validateProfile(values)
    setErrors(found)
    const firstInvalid = (['preferredName', 'personalEmail', 'mobileNumber'] as const).find((k) => found[k])
    if (firstInvalid) {
      document.getElementById(`ep-${firstInvalid}`)?.focus()
      return
    }

    setSaving(true)
    try {
      // Replaced by PUT /api/profile (and the avatar endpoints) once Laravel exists.
      await updateProfile({
        preferredName: values.preferredName.trim() || undefined,
        personalEmail: values.personalEmail.trim() || undefined,
        mobileNumber: values.mobileNumber.trim() || undefined,
        avatarUrl,
      })
      saved.current = true
      navigate('/profile', { state: { updated: true } })
    } catch (error) {
      // Laravel 422: show its messages next to the fields.
      const server = getFieldErrors(error, { preferred_name: 'preferredName', personal_email: 'personalEmail', mobile_number: 'mobileNumber' })
      if (Object.keys(server).length > 0) setErrors(server as ProfileErrors)
      else setSaveError(true)
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (dirty) setConfirmDiscard(true)
    else navigate('/profile')
  }

  const errorEntries = (['preferredName', 'personalEmail', 'mobileNumber'] as const).filter((k) => errors[k])
  const labels = { preferredName: 'Preferred name', personalEmail: 'Personal email', mobileNumber: 'Mobile number' }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate aria-label="Edit profile" className="space-y-6 border bg-white p-5 sm:p-6">
        {errorEntries.length > 0 && (
          <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive">Please fix the following before saving:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errorEntries.map((k) => (
                <li key={k}>
                  <a
                    href={`#ep-${k}`}
                    className="font-medium underline underline-offset-2"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(`ep-${k}`)?.focus()
                    }}
                  >
                    {labels[k]}
                  </a>
                  : {errors[k]}
                </li>
              ))}
            </ul>
          </div>
        )}
        {saveError && (
          <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive">Unable to update profile</p>
            <p className="mt-1 text-foreground/80">Please check your information and try again.</p>
          </div>
        )}

        <section aria-labelledby="photo-heading">
          <h2 id="photo-heading" className="mb-3 font-serif text-lg font-semibold text-primary">
            Profile Photo
          </h2>
          <ProfileAvatar name={getUserFullName(user)} imageUrl={avatarUrl} onSelect={selectPhoto} onRemove={removePhoto} />
        </section>

        <section aria-labelledby="details-heading" className="space-y-5 border-t pt-6">
          <h2 id="details-heading" className="font-serif text-lg font-semibold text-primary">
            Personal Information
          </h2>
          <Field id="ep-preferredName" label="Preferred Name" optional error={errors.preferredName} help="How you would like to be addressed, e.g. in greetings.">
            <Input
              id="ep-preferredName"
              value={values.preferredName}
              onChange={(e) => setField('preferredName', e.target.value)}
              aria-invalid={Boolean(errors.preferredName)}
              aria-describedby={errors.preferredName ? 'ep-preferredName-error' : 'ep-preferredName-help'}
              className={cn('h-10 bg-white', errors.preferredName && 'border-destructive')}
            />
          </Field>
          <Field id="ep-personalEmail" label="Personal Email" optional error={errors.personalEmail}>
            <Input
              id="ep-personalEmail"
              type="email"
              value={values.personalEmail}
              onChange={(e) => setField('personalEmail', e.target.value)}
              aria-invalid={Boolean(errors.personalEmail)}
              aria-describedby={errors.personalEmail ? 'ep-personalEmail-error' : undefined}
              className={cn('h-10 bg-white', errors.personalEmail && 'border-destructive')}
            />
          </Field>
          <Field id="ep-mobileNumber" label="Mobile Number" optional error={errors.mobileNumber} help="Philippine mobile number, e.g. 0917 123 4567 or +63 917 123 4567.">
            <Input
              id="ep-mobileNumber"
              type="tel"
              value={values.mobileNumber}
              onChange={(e) => setField('mobileNumber', e.target.value)}
              aria-invalid={Boolean(errors.mobileNumber)}
              aria-describedby={errors.mobileNumber ? 'ep-mobileNumber-error' : 'ep-mobileNumber-help'}
              className={cn('h-10 bg-white', errors.mobileNumber && 'border-destructive')}
            />
          </Field>
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t pt-6">
          <Button type="submit" disabled={saving} aria-busy={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" className="bg-white" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          {dirty && <p className="text-sm text-muted-foreground">You have unsaved changes.</p>}
        </div>
        <p className="text-xs text-muted-foreground">Prototype: saving updates this browser session only. No data is sent to a server.</p>
      </form>

      <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>You have unsaved changes to your profile. If you leave now, they will be lost.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDiscard(false)}>
              Keep Editing
            </Button>
            <Button onClick={() => navigate('/profile')}>Discard Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function EditProfilePage() {
  const { user, isLoading, error, retry } = useAuth()

  let content
  if (error) content = <ProfileError onRetry={retry} />
  else if (isLoading || !user) content = <ProfileSkeleton />
  else
    content = (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EditForm user={user} />
        </div>
        <aside className="min-w-0 space-y-4 self-start">
          <ProfileSection id="company-info-heading" title="Company Information" description="Read-only. Maintained by HR.">
            <ProfileField label="Employee ID" value={user.employeeId} mono readOnly />
            <ProfileField label="Company Email" value={user.workEmail} readOnly />
            <ProfileField label="Job Title" value={user.jobTitle} readOnly />
            <ProfileField label="Department" value={`${user.departmentName} Department`} readOnly />
            <ProfileField label="Status" value={employmentStatusLabels[user.employmentStatus]} readOnly />
            <ProfileField label="Location" value={user.location} readOnly />
            <ProfileField label="Date Joined" value={user.dateJoined ? formatDate(user.dateJoined, 'long') : undefined} readOnly />
            <ProfileField label="Manager" value={user.managerName} readOnly />
          </ProfileSection>
          <p role="note" className="text-xs leading-relaxed text-muted-foreground">
            Company-managed information is maintained by HR. To request a correction, submit an{' '}
            <Link to="/forms?category=hr" className="text-primary underline-offset-4 hover:underline">
              employee information request
            </Link>.
          </p>
          <Link to="/profile" className="block text-sm text-primary underline-offset-4 hover:underline">
            View my profile
          </Link>
        </aside>
      </div>
    )

  return (
    <PageContainer className="pb-16">
      <PageHeader
        title="Edit Profile"
        description="Update your personal contact information. Company information is managed by HR."
        breadcrumbs={[{ label: 'My Profile', href: '/profile' }, { label: 'Edit' }]}
      />
      <div className="mt-8">{content}</div>
    </PageContainer>
  )
}

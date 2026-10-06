import { useRef, useState, type FormEvent } from 'react'
import { RequestField, fieldId } from '@/components/forms/RequestField'
import { ResumeUpload } from '@/components/recruitment/ResumeUpload'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { referralFields } from '@/data/recruitmentForms'
import type { FieldErrors } from '@/lib/requestValidation'
import { validateReferral } from '@/lib/recruitmentValidation'
import { getReferrerFromUser, submitReferral } from '@/services/recruitmentService'
import type { JobOpening, Referral } from '@/types/recruitment'

const field = (id: string) => referralFields.find((f) => f.id === id)!
const targetId = (id: string) => (id === 'resume' ? 'rf-attachment' : fieldId(id))
const order = ['candidate-name', 'candidate-email', 'candidate-mobile', 'relationship', 'resume', 'notes', 'confirm']

/** Employee referral form. The referring employee comes from the signed-in user and is shown read-only. */
export function ReferralForm({ job, onSubmitted }: { job: JobOpening; onSubmitted: (referral: Referral) => void }) {
  const { user } = useAuth()
  const [values, setValues] = useState<Record<string, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  const referrer = user ? getReferrerFromUser(user) : undefined

  const setValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }))
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }))
  }
  const render = (id: string) => <RequestField field={field(id)} value={values[id] ?? ''} error={errors[id]} onChange={(v) => setValue(id, v)} />
  const errorIds = order.filter((id) => errors[id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!referrer) return
    setSubmitError(false)
    const found = validateReferral(values, file ?? undefined)
    setErrors(found)
    if (order.some((id) => found[id])) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setSubmitting(true)
    try {
      onSubmitted(await submitReferral({ job, referrer, values, resume: file ? { name: file.name, size: file.size } : undefined }))
    } catch {
      setSubmitError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Employee referral form" className="space-y-5 border bg-white p-5 sm:p-6">
      {errorIds.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm focus-visible:outline-2 focus-visible:outline-ring">
          <p className="font-semibold text-destructive">Please fix the following before submitting:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errorIds.map((id) => (
              <li key={id}>
                <a
                  href={`#${targetId(id)}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(targetId(id))?.focus()
                  }}
                  className="font-medium underline underline-offset-2"
                >
                  {id === 'confirm' ? 'Confirmation' : id === 'resume' ? 'Resume' : field(id).label}
                </a>
                : {errors[id]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {submitError && (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Unable to submit referral</p>
          <p className="mt-1 text-foreground/80">Please check your information and try again.</p>
        </div>
      )}

      <fieldset>
        <legend className="-mt-px bg-white pr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Referring Employee</legend>
        {referrer ? (
          <dl className="mt-2 grid gap-3 border bg-secondary p-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee Name</dt>
              <dd className="text-sm">{referrer.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee ID</dt>
              <dd className="text-sm">{referrer.employeeId}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</dt>
              <dd className="text-sm">{referrer.department}</dd>
            </div>
          </dl>
        ) : (
          <p role="status" className="mt-2 text-sm text-muted-foreground">
            Loading your employee information…
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-5 border-t pt-5">
        <legend className="-mt-px bg-white pr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Candidate</legend>
        {render('candidate-name')}
        <div className="grid gap-5 sm:grid-cols-2">
          {render('candidate-email')}
          {render('candidate-mobile')}
        </div>
        {render('relationship')}
        <ResumeUpload
          file={file}
          onChange={(next) => {
            setFile(next)
            if (errors.resume) setErrors((p) => ({ ...p, resume: '' }))
          }}
          error={errors.resume}
        />
        {render('notes')}
      </fieldset>

      <fieldset className="border-t pt-5">
        <legend className="-mt-px bg-white pr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Confirmation</legend>
        {render('confirm')}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" disabled={submitting || !referrer} aria-busy={submitting}>
          {submitting ? 'Submitting…' : 'Submit Referral'}
        </Button>
        <p className="text-xs text-muted-foreground">Demo: the referral is kept in this browser session only. No referral process is connected yet.</p>
      </div>
    </form>
  )
}

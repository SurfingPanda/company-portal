import { useRef, useState, type FormEvent } from 'react'
import { RequestField, fieldId } from '@/components/forms/RequestField'
import { ResumeUpload } from '@/components/recruitment/ResumeUpload'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { applicationFields } from '@/data/recruitmentForms'
import type { FieldErrors } from '@/lib/requestValidation'
import { validateApplication } from '@/lib/recruitmentValidation'
import { getUserFullName } from '@/lib/user'
import { submitApplication } from '@/services/recruitmentService'
import type { Application, JobOpening } from '@/types/recruitment'

const field = (id: string) => applicationFields.find((f) => f.id === id)!
const targetId = (id: string) => (id === 'resume' ? 'rf-attachment' : fieldId(id))
const order = ['full-name', 'email', 'mobile', 'experience', 'skills', 'resume', 'cover-letter', 'confirm']

/** Deliberately simple application form. It collects no government IDs, bank, medical or other sensitive information. */
export function ApplicationForm({ job, onSubmitted }: { job: JobOpening; onSubmitted: (application: Application) => void }) {
  const { user } = useAuth()
  // Prefill name from the signed-in employee; everything stays editable. Email/mobile are left for the applicant.
  const [values, setValues] = useState<Record<string, string>>(() => ({ 'full-name': user ? getUserFullName(user) : '' }))
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  const setValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }))
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }))
  }
  const render = (id: string) => <RequestField field={field(id)} value={values[id] ?? ''} error={errors[id]} onChange={(v) => setValue(id, v)} />
  const labelFor = (id: string) => (id === 'resume' ? 'Resume / CV' : field(id).label)
  const errorIds = order.filter((id) => errors[id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(false)
    const found = validateApplication(values, file ?? undefined)
    setErrors(found)
    if (order.some((id) => found[id])) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setSubmitting(true)
    try {
      onSubmitted(await submitApplication({ job, values, resume: { name: file!.name, size: file!.size, file: file! } }))
    } catch {
      setSubmitError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Job application form" className="space-y-5 border bg-white p-5 sm:p-6">
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
                  {id === 'confirm' ? 'Confirmation' : labelFor(id)}
                </a>
                : {errors[id]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {submitError && (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Unable to submit application</p>
          <p className="mt-1 text-foreground/80">Please check your information and try again.</p>
        </div>
      )}

      <fieldset className="space-y-5">
        <legend className="-mt-px bg-white pr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Applicant Information</legend>
        {render('full-name')}
        <div className="grid gap-5 sm:grid-cols-2">
          {render('email')}
          {render('mobile')}
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t pt-5">
        <legend className="-mt-px bg-white pr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Application Information</legend>
        <div>
          <p className="mb-1.5 text-sm font-medium">Position</p>
          <p className="border bg-secondary px-3 py-2 text-sm" aria-label={`Position: ${job.title}`}>
            {job.title} <span className="text-muted-foreground">· {job.department}</span>
          </p>
        </div>
        {render('experience')}
        {render('skills')}
        <ResumeUpload
          file={file}
          required
          onChange={(next) => {
            setFile(next)
            if (errors.resume) setErrors((p) => ({ ...p, resume: '' }))
          }}
          error={errors.resume}
        />
        {render('cover-letter')}
      </fieldset>

      <fieldset className="border-t pt-5">
        <legend className="-mt-px bg-white pr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Confirmation</legend>
        {render('confirm')}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Submitting…' : 'Submit Application'}
        </Button>
        <p className="text-xs text-muted-foreground">Demo: the application is kept in this browser session only and is not sent to a recruitment system.</p>
      </div>
    </form>
  )
}

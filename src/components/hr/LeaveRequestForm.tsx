import { UPLOAD_NOTE } from '@/lib/uploadNotice'
import { useRef, useState, type FormEvent } from 'react'
import { AttachmentUpload } from '@/components/forms/AttachmentUpload'
import { RequestField, fieldId } from '@/components/forms/RequestField'
import { Button } from '@/components/ui/button'
import { LEAVE_ATTACHMENT_EXTENSIONS, validateLeave } from '@/lib/leaveValidation'
import type { FieldErrors } from '@/lib/requestValidation'
import { submitLeaveRequest } from '@/services/hrService'
import type { EmployeeRequest, EmployeeRequestType } from '@/types/request'

interface LeaveRequestFormProps {
  /** The `rt-leave` request type. Its fields drive the form, so the field list stays in one place. */
  requestType: EmployeeRequestType
  onSubmitted: (request: EmployeeRequest) => void
}

const targetId = (id: string) => (id === 'attachment' ? 'rf-attachment' : fieldId(id))

/**
 * Leave request form. Frontend validation only; it never looks at balances or entitlement (HR owns those).
 * Submitting creates a mock request in the shared request store.
 */
export function LeaveRequestForm({ requestType, onSubmitted }: LeaveRequestFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  const field = (id: string) => requestType.fields.find((f) => f.id === id)!
  const renderField = (id: string) => <RequestField field={field(id)} value={values[id] ?? ''} error={errors[id]} onChange={(v) => setValue(id, v)} />

  const setValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }))
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }))
  }

  // Order of the error summary.
  const order = ['leave-type', 'start-date', 'end-date', 'reason', 'attachment', 'contact-number', 'contact-email']
  const labelFor = (id: string) => (id === 'attachment' ? 'Attachment' : field(id).label)
  const errorIds = order.filter((id) => errors[id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(false)

    const found = validateLeave(requestType, values, file ?? undefined)
    setErrors(found)
    if (order.some((id) => found[id])) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }

    setSubmitting(true)
    try {
      onSubmitted(await submitLeaveRequest(values, file ? { name: file.name, size: file.size } : undefined, file ?? undefined))
    } catch {
      setSubmitError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Leave request form" className="space-y-5 border bg-white p-5 sm:p-6">
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
                  {labelFor(id)}
                </a>
                : {errors[id]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {submitError && (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Unable to submit request</p>
          <p className="mt-1 text-foreground/80">Please check your information and try again.</p>
        </div>
      )}

      <fieldset className="space-y-5">
        <legend className="-mt-px bg-white pr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Leave Details</legend>
        {renderField('leave-type')}
        <div className="grid gap-5 sm:grid-cols-2">
          {renderField('start-date')}
          {renderField('end-date')}
        </div>
        {renderField('reason')}
      </fieldset>

      <AttachmentUpload
        file={file}
        onChange={(next) => {
          setFile(next)
          if (errors.attachment) setErrors((p) => ({ ...p, attachment: '' }))
        }}
        error={errors.attachment}
        help={`Optional supporting document. Maximum 5 MB (${LEAVE_ATTACHMENT_EXTENSIONS.join(', ')}). ${UPLOAD_NOTE}`}
      />

      <fieldset className="space-y-5 border-t pt-5">
        <legend className="-mt-px bg-white pr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Contact During Leave</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {renderField('contact-number')}
          {renderField('contact-email')}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Submitting…' : 'Submit Request'}
        </Button>
        <p className="text-xs text-muted-foreground">Prototype: the request is kept in this browser session only. HR decides on it; the portal does not.</p>
      </div>
    </form>
  )
}

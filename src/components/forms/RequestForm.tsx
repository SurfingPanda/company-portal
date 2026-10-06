import { useRef, useState, type FormEvent } from 'react'
import { AttachmentUpload } from '@/components/forms/AttachmentUpload'
import { RequestField, fieldId } from '@/components/forms/RequestField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getApiErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import { validateRequest, type FieldErrors } from '@/lib/requestValidation'
import { submitRequest } from '@/services/requestService'
import type { EmployeeRequest, EmployeeRequestType } from '@/types/request'

interface RequestFormProps {
  requestType: EmployeeRequestType
  onSubmitted: (request: EmployeeRequest) => void
}

/**
 * Reusable, configuration-driven request form. It renders the request type's `fields`, validates on
 * the client, and calls the request service. There is no per-request-type page or component.
 */
export function RequestForm({ requestType, onSubmitted }: RequestFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  const setValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }))
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }))
  }

  // Order used for the error summary and for focusing the first problem.
  const order = ['title', 'description', ...requestType.fields.map((f) => f.id), 'attachment']
  const labelFor = (id: string) =>
    id === 'title' ? 'Request title' : id === 'description' ? 'Description' : id === 'attachment' ? 'Attachment' : (requestType.fields.find((f) => f.id === id)?.label ?? id)
  const targetId = (id: string) => (id === 'title' ? 'rf-title' : id === 'description' ? 'rf-description' : id === 'attachment' ? 'rf-attachment' : fieldId(id))

  const focusField = (id: string) => document.getElementById(targetId(id))?.focus()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const found = validateRequest(requestType, title, description, values, file ?? undefined)
    setErrors(found)
    const firstError = order.find((id) => found[id])
    if (firstError) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }

    setSubmitting(true)
    try {
      const request = await submitRequest({
        requestType,
        title,
        description,
        values,
        attachment: file ? { name: file.name, size: file.size } : undefined,
        file: file ?? undefined,
      })
      onSubmitted(request)
    } catch (error) {
      // Laravel 422: show its messages next to the matching fields (subject/description are the title/description inputs).
      const fieldErrors = getFieldErrors(error, { subject: 'title' })
      const mapped = Object.fromEntries(Object.entries(fieldErrors).map(([key, message]) => [key.replace(/^form_data\./, ''), message]))
      if (Object.keys(mapped).length > 0) {
        setErrors(mapped)
        requestAnimationFrame(() => summaryRef.current?.focus())
      }
      setSubmitError(getApiErrorMessage(error, 'Please check your information and try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const errorIds = order.filter((id) => errors[id])

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={`${requestType.title} form`} className="space-y-5 border bg-white p-5 sm:p-6">
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
                    focusField(id)
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

      {submitError !== null && (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Unable to submit request</p>
          <p className="mt-1 text-foreground/80">{submitError}</p>
        </div>
      )}

      <div>
        <label htmlFor="rf-title" className="mb-1.5 block text-sm font-medium">
          Request title
          <span aria-hidden="true" className="ml-0.5 text-destructive">*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <Input
          id="rf-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (errors.title) setErrors((p) => ({ ...p, title: '' }))
          }}
          placeholder={`e.g. ${requestType.title}`}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'rf-title-error' : undefined}
          className={`h-10 bg-white ${errors.title ? 'border-destructive' : ''}`}
        />
        {errors.title && (
          <p id="rf-title-error" className="mt-1 text-sm font-medium text-destructive">
            <span aria-hidden="true">⚠ </span>
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="rf-description" className="mb-1.5 block text-sm font-medium">
          Description
          <span aria-hidden="true" className="ml-0.5 text-destructive">*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <Textarea
          id="rf-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            if (errors.description) setErrors((p) => ({ ...p, description: '' }))
          }}
          rows={3}
          placeholder="Briefly describe your request."
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'rf-description-error' : undefined}
          className={`bg-white ${errors.description ? 'border-destructive' : ''}`}
        />
        {errors.description && (
          <p id="rf-description-error" className="mt-1 text-sm font-medium text-destructive">
            <span aria-hidden="true">⚠ </span>
            {errors.description}
          </p>
        )}
      </div>

      <fieldset className="space-y-5 border-t pt-5">
        <legend className="-mt-px bg-white pr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Required Information</legend>
        {requestType.fields.map((field) => (
          <RequestField key={field.id} field={field} value={values[field.id] ?? ''} error={errors[field.id]} onChange={(v) => setValue(field.id, v)} />
        ))}
      </fieldset>

      <AttachmentUpload
        file={file}
        onChange={(next) => {
          setFile(next)
          if (errors.attachment) setErrors((p) => ({ ...p, attachment: '' }))
        }}
        required={requestType.requiresAttachment}
        error={errors.attachment}
      />

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Submitting…' : 'Submit Request'}
        </Button>
        <p className="text-xs text-muted-foreground">Prototype: submitting records the request in this browser session only.</p>
      </div>
    </form>
  )
}

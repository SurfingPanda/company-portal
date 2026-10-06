import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { AttachmentUpload } from '@/components/forms/AttachmentUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { deviceTypeOptions, operatingSystemOptions, ticketCategoryOptions, ticketLocationOptions, ticketTypeOptions } from '@/data/helpdeskOptions'
import { ASSET_TAG_MAX, DESCRIPTION_MAX, SUBJECT_MAX, validateTicket, type TicketFormErrors, type TicketFormValues } from '@/lib/helpdeskValidation'
import { UPLOAD_NOTE } from '@/lib/uploadNotice'
import { cn } from '@/lib/utils'
import { createTicket } from '@/services/helpdeskService'
import type { HelpdeskTicket, TicketCategory, TicketType } from '@/types/helpdesk'

const EMPTY: TicketFormValues = { type: '', category: '', subject: '', description: '', location: '', deviceType: '', operatingSystem: '', assetTag: '' }

function Field({ id, label, required, error, help, children }: { id: string; label: string; required?: boolean; error?: string; help?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-0.5 text-destructive">*</span>
            <span className="sr-only"> (required)</span>
          </>
        ) : (
          <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
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

function SelectField({ id, label, value, onChange, options, placeholder, required, error }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string; required?: boolean; error?: string }) {
  return (
    <Field id={id} label={label} required={required} error={error}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={cn('h-10 w-full bg-white', error && 'border-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

const asOptions = (items: string[]) => items.map((i) => ({ value: i, label: i }))

/** Reusable ticket form. Validates on the client; the backend/helpdesk system must validate again. */
export function TicketForm({ onCreated }: { onCreated: (ticket: HelpdeskTicket) => void }) {
  const [values, setValues] = useState(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<TicketFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  const set = (key: keyof TicketFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const order: (keyof TicketFormErrors)[] = ['type', 'category', 'subject', 'description', 'assetTag', 'attachment']
  const labels: Record<string, string> = { type: 'Request type', category: 'Category', subject: 'Subject', description: 'Description', assetTag: 'Asset tag', attachment: 'Attachment' }
  const targets: Record<string, string> = { type: 'tk-type', category: 'tk-category-field', subject: 'tk-subject', description: 'tk-description', assetTag: 'tk-asset', attachment: 'rf-attachment' }
  const errorKeys = order.filter((k) => errors[k])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(false)
    const found = validateTicket(values, file ? { name: file.name, size: file.size } : undefined)
    setErrors(found)
    if (order.some((k) => found[k])) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setSubmitting(true)
    try {
      // Replaced by POST /api/helpdesk/tickets (+ the attachment endpoint) once the backend exists.
      const ticket = await createTicket({
        type: values.type as TicketType,
        category: values.category as TicketCategory,
        subject: values.subject,
        description: values.description,
        location: values.location,
        deviceType: values.deviceType,
        operatingSystem: values.operatingSystem,
        assetTag: values.assetTag,
        attachment: file ? { name: file.name, size: file.size } : undefined,
        file: file ?? undefined,
      })
      onCreated(ticket)
    } catch {
      setSubmitError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="IT support request" className="space-y-5 border bg-white p-5 sm:p-6">
      <p className="flex items-start gap-2 border border-dashed border-muted-foreground/40 px-3 py-2 text-xs text-foreground/80">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        Never include passwords, verification codes or other credentials in a ticket. IT will never ask you for them.
      </p>

      {errorKeys.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm focus-visible:outline-2 focus-visible:outline-ring">
          <p className="font-semibold text-destructive">Please fix the following before submitting:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errorKeys.map((k) => (
              <li key={k}>
                <a
                  href={`#${targets[k]}`}
                  className="font-medium underline underline-offset-2"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(targets[k])?.focus()
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
      {submitError && (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Unable to submit request</p>
          <p className="mt-1 text-foreground/80">Please check your information and try again.</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField id="tk-type" label="Request Type" required value={values.type} onChange={(v) => set('type', v)} options={ticketTypeOptions} placeholder="Select a type" error={errors.type} />
        <SelectField id="tk-category-field" label="Category" required value={values.category} onChange={(v) => set('category', v)} options={ticketCategoryOptions} placeholder="Select a category" error={errors.category} />
      </div>

      <Field id="tk-subject" label="Subject" required error={errors.subject} help={`Up to ${SUBJECT_MAX} characters.`}>
        <Input id="tk-subject" value={values.subject} onChange={(e) => set('subject', e.target.value)} placeholder="Unable to connect to office Wi-Fi" aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'tk-subject-error' : 'tk-subject-help'} className={cn('h-10 bg-white', errors.subject && 'border-destructive')} />
      </Field>

      <Field id="tk-description" label="Description" required error={errors.description} help={`Up to ${DESCRIPTION_MAX} characters.`}>
        <Textarea
          id="tk-description"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          rows={7}
          placeholder="Please describe the issue, what you were trying to do, and any error messages you received."
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'tk-description-error' : 'tk-description-help'}
          className={cn('bg-white', errors.description && 'border-destructive')}
        />
      </Field>

      <fieldset className="space-y-5 border-t pt-5">
        <legend className="-mt-px bg-white pr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Optional Details</legend>
        <SelectField id="tk-location" label="Location" value={values.location} onChange={(v) => set('location', v)} options={asOptions(ticketLocationOptions)} placeholder="Select a location" />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField id="tk-device" label="Device Type" value={values.deviceType} onChange={(v) => set('deviceType', v)} options={asOptions(deviceTypeOptions)} placeholder="Select a device" />
          <SelectField id="tk-os" label="Operating System" value={values.operatingSystem} onChange={(v) => set('operatingSystem', v)} options={asOptions(operatingSystemOptions)} placeholder="Select a system" />
        </div>
        <Field id="tk-asset" label="Asset Tag" error={errors.assetTag} help="If your device has a tag. Not required.">
          <Input id="tk-asset" value={values.assetTag} maxLength={ASSET_TAG_MAX + 10} onChange={(e) => set('assetTag', e.target.value)} aria-invalid={Boolean(errors.assetTag)} aria-describedby={errors.assetTag ? 'tk-asset-error' : 'tk-asset-help'} className={cn('h-10 bg-white', errors.assetTag && 'border-destructive')} />
        </Field>
      </fieldset>

      <AttachmentUpload
        file={file}
        onChange={(f) => {
          setFile(f)
          setErrors((p) => ({ ...p, attachment: undefined }))
        }}
        error={errors.attachment}
        help={`Optional. PNG, JPG, PDF, text or Office files up to 5 MB. ${UPLOAD_NOTE}`}
      />

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Submitting…' : 'Submit Request'}
        </Button>
        <p className="text-xs text-muted-foreground">Prototype: this creates a sample ticket in this browser session only.</p>
      </div>
    </form>
  )
}

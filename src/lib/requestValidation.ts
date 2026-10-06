import type { EmployeeRequestType, RequestField } from '@/types/request'

export type FieldErrors = Record<string, string>

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

const REQUIRED_MESSAGE = 'This field is required.'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime())

function validateField(field: RequestField, value: string, values: Record<string, string>): string | undefined {
  const trimmed = value.trim()

  if (field.type === 'checkbox') {
    return field.required && value !== 'true' ? 'Please confirm to continue.' : undefined
  }
  if (!trimmed) return field.required ? REQUIRED_MESSAGE : undefined

  switch (field.type) {
    case 'email':
      return emailPattern.test(trimmed) ? undefined : 'Enter a valid email address.'
    case 'date': {
      if (!isValidDate(trimmed)) return 'Enter a valid date.'
      const other = field.notBeforeField ? values[field.notBeforeField] : undefined
      if (other && isValidDate(other) && trimmed < other) return 'This date cannot be earlier than the start date.'
      return undefined
    }
    case 'number': {
      const n = Number(trimmed)
      if (Number.isNaN(n)) return 'Enter a valid number.'
      if (field.min !== undefined && n < field.min) return `Enter a number of ${field.min} or more.`
      return undefined
    }
    case 'select':
      return field.options?.includes(trimmed) ? undefined : 'Choose one of the options.'
    default:
      return undefined
  }
}

/**
 * Basic frontend checks only. The Laravel backend must validate every request again.
 * Returns an object keyed by field id (plus "title", "description" and "attachment").
 */
export function validateRequest(
  requestType: EmployeeRequestType,
  title: string,
  description: string,
  values: Record<string, string>,
  attachment?: { size: number },
): FieldErrors {
  const errors: FieldErrors = {}

  if (!title.trim()) errors.title = REQUIRED_MESSAGE
  if (!description.trim()) errors.description = REQUIRED_MESSAGE

  requestType.fields.forEach((field) => {
    const message = validateField(field, values[field.id] ?? '', values)
    if (message) errors[field.id] = message
  })

  if (requestType.requiresAttachment && !attachment) errors.attachment = 'Please attach a file.'
  if (attachment && attachment.size > MAX_ATTACHMENT_BYTES) errors.attachment = 'The file is larger than 10 MB.'

  return errors
}

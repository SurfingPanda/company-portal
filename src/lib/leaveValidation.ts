import { validateRequest, type FieldErrors } from '@/lib/requestValidation'
import type { EmployeeRequestType } from '@/types/request'

export const LEAVE_ATTACHMENT_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']
export const LEAVE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024

const yearOf = (iso: string) => Number(iso.slice(0, 4))

/**
 * Frontend checks for the leave form: required fields, valid dates, end date not before start date,
 * and the optional attachment's type and size. It deliberately does NOT look at balances,
 * entitlement, payroll or approval eligibility; those are handled by HR. The backend validates again.
 *
 * Reuses the shared request validation for per-field rules (it also checks "end date not before start date").
 */
export function validateLeave(requestType: EmployeeRequestType, values: Record<string, string>, attachment?: { name: string; size: number }): FieldErrors {
  const { title: _title, description: _description, ...errors } = validateRequest(requestType, 'leave', 'leave', values, undefined)

  for (const id of ['start-date', 'end-date']) {
    const value = values[id]?.trim()
    if (value && !errors[id] && (yearOf(value) < 2000 || yearOf(value) > 2100)) errors[id] = 'Enter a date between the years 2000 and 2100.'
  }

  if (attachment) {
    const extension = attachment.name.split('.').pop()?.toLowerCase() ?? ''
    if (!LEAVE_ATTACHMENT_EXTENSIONS.includes(extension)) errors.attachment = `This file type is not allowed. Use: ${LEAVE_ATTACHMENT_EXTENSIONS.join(', ')}.`
    else if (attachment.size > LEAVE_ATTACHMENT_MAX_BYTES) errors.attachment = 'The file is larger than 5 MB.'
  }

  return errors
}

import { applicationFields, referralFields } from '@/data/recruitmentForms'
import { validateRequest, type FieldErrors } from '@/lib/requestValidation'
import type { EmployeeRequestType, RequestField } from '@/types/request'

export const RESUME_EXTENSIONS = ['pdf', 'doc', 'docx']
export const RESUME_MAX_BYTES = 5 * 1024 * 1024

const phonePattern = /^[+\d][\d\s()-]{6,19}$/

/** Reuses the shared per-field rules (required, email, number, select, checkbox) by wrapping the fields as a request type. */
const asRequestType = (fields: RequestField[]) => ({ fields, requiresAttachment: false }) as unknown as EmployeeRequestType

function validateFields(fields: RequestField[], values: Record<string, string>, mobileId: string): FieldErrors {
  const { title: _title, description: _description, ...errors } = validateRequest(asRequestType(fields), 'x', 'x', values)
  const mobile = values[mobileId]?.trim()
  if (mobile && !errors[mobileId] && !phonePattern.test(mobile)) errors[mobileId] = 'Enter a valid mobile number.'
  return errors
}

/** Resume checks: PDF/DOC/DOCX only, max 5 MB, and required when `required` is set. The backend must validate uploads again. */
export function validateResume(file: { name: string; size: number } | undefined, required: boolean): string | undefined {
  if (!file) return required ? 'Please attach your resume or CV.' : undefined
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!RESUME_EXTENSIONS.includes(extension)) return 'Use a PDF, DOC or DOCX file.'
  if (file.size > RESUME_MAX_BYTES) return 'The file is larger than 5 MB.'
  return undefined
}

export function validateApplication(values: Record<string, string>, resume?: { name: string; size: number }): FieldErrors {
  const errors = validateFields(applicationFields, values, 'mobile')
  const resumeError = validateResume(resume, true)
  if (resumeError) errors.resume = resumeError
  return errors
}

export function validateReferral(values: Record<string, string>, resume?: { name: string; size: number }): FieldErrors {
  const errors = validateFields(referralFields, values, 'candidate-mobile')
  const resumeError = validateResume(resume, false)
  if (resumeError) errors.resume = resumeError
  return errors
}

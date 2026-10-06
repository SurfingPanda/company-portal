import { ATTACHMENT_EXTENSIONS, ATTACHMENT_MAX_BYTES } from '@/data/helpdeskOptions'

export interface TicketFormValues {
  type: string
  category: string
  subject: string
  description: string
  location: string
  deviceType: string
  operatingSystem: string
  assetTag: string
}

export type TicketFormErrors = Partial<Record<keyof TicketFormValues | 'attachment', string>>

export const SUBJECT_MAX = 120
export const DESCRIPTION_MAX = 4000
export const ASSET_TAG_MAX = 40
export const REPLY_MAX = 2000

const REQUIRED = 'This field is required.'

/** Basic attachment checks (type and size). The backend must validate uploads again. */
export function validateAttachment(file?: { name: string; size: number }): string | undefined {
  if (!file) return undefined
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ATTACHMENT_EXTENSIONS.includes(extension)) return `This file type is not allowed. Use: ${ATTACHMENT_EXTENSIONS.join(', ')}.`
  if (file.size > ATTACHMENT_MAX_BYTES) return 'The file is larger than 5 MB.'
  return undefined
}

export function validateTicket(values: TicketFormValues, attachment?: { name: string; size: number }): TicketFormErrors {
  const errors: TicketFormErrors = {}
  if (!values.type) errors.type = REQUIRED
  if (!values.category) errors.category = REQUIRED

  const subject = values.subject.trim()
  if (!subject) errors.subject = REQUIRED
  else if (subject.length > SUBJECT_MAX) errors.subject = `Keep the subject to ${SUBJECT_MAX} characters or fewer.`

  const description = values.description.trim()
  if (!description) errors.description = REQUIRED
  else if (description.length > DESCRIPTION_MAX) errors.description = `Keep the description to ${DESCRIPTION_MAX} characters or fewer.`

  if (values.assetTag.trim().length > ASSET_TAG_MAX) errors.assetTag = `Keep the asset tag to ${ASSET_TAG_MAX} characters or fewer.`

  const attachmentError = validateAttachment(attachment)
  if (attachmentError) errors.attachment = attachmentError
  return errors
}

export function validateReply(message: string, attachment?: { name: string; size: number }): { message?: string; attachment?: string } {
  const errors: { message?: string; attachment?: string } = {}
  const trimmed = message.trim()
  if (!trimmed) errors.message = 'Write a reply before sending.'
  else if (trimmed.length > REPLY_MAX) errors.message = `Keep the reply to ${REPLY_MAX} characters or fewer.`
  const attachmentError = validateAttachment(attachment)
  if (attachmentError) errors.attachment = attachmentError
  return errors
}

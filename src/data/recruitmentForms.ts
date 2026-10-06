import type { RequestField } from '@/types/request'

/**
 * Field definitions for the application and referral forms. They use the same `RequestField` shape as
 * the Phase 8 forms, so one field renderer and one set of validation rules serve every form.
 * Deliberately simple: no government IDs, bank details, medical, political or religious information.
 */

export const applicationFields: RequestField[] = [
  { id: 'full-name', label: 'Full name', type: 'text', required: true },
  { id: 'email', label: 'Email', type: 'email', required: true },
  { id: 'mobile', label: 'Mobile number', type: 'text', required: true, placeholder: 'e.g. +63 900 000 0000' },
  { id: 'experience', label: 'Years of experience', type: 'number', required: true, min: 0, helpText: 'Enter 0 if you have none.' },
  { id: 'skills', label: 'Relevant skills', type: 'textarea', placeholder: 'Skills that relate to this position.' },
  { id: 'cover-letter', label: 'Cover letter', type: 'textarea', placeholder: 'Optional. A few lines about why you are interested.' },
  { id: 'confirm', label: 'I confirm that the information I provided is accurate to the best of my knowledge.', type: 'checkbox', required: true },
]

export const referralFields: RequestField[] = [
  { id: 'candidate-name', label: 'Candidate full name', type: 'text', required: true },
  { id: 'candidate-email', label: 'Candidate email', type: 'email', required: true },
  { id: 'candidate-mobile', label: 'Candidate mobile number', type: 'text', placeholder: 'Optional' },
  { id: 'relationship', label: 'Relationship to candidate', type: 'select', required: true, options: ['Former colleague', 'Friend', 'Family member', 'Professional acquaintance', 'Other'] },
  { id: 'notes', label: 'Additional notes', type: 'textarea', placeholder: 'Optional. Anything that helps HR understand the referral.' },
  { id: 'confirm', label: 'I confirm that the candidate agrees to be referred and that the information provided is accurate.', type: 'checkbox', required: true },
]

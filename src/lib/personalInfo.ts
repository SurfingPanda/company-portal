import type { EmergencyContact } from '@/types/personalInfo'

/** What a new, empty contact row holds. */
export const emptyContact = (): EmergencyContact => ({ name: '', relationship: '', phone: '', alternate_phone: null, email: null })

/** A contact the form may send: the three required fields are filled in. */
export const isCompleteContact = (c: EmergencyContact) => c.name.trim() !== '' && c.relationship.trim() !== '' && c.phone.trim() !== ''

/** Blank contact rows are dropped before saving; trimmed values are sent. */
export const cleanContacts = (contacts: EmergencyContact[]): EmergencyContact[] =>
  contacts
    .filter((c) => c.name.trim() || c.relationship.trim() || c.phone.trim() || c.alternate_phone?.trim() || c.email?.trim())
    .map((c) => ({ name: c.name.trim(), relationship: c.relationship.trim(), phone: c.phone.trim(), alternate_phone: c.alternate_phone?.trim() || null, email: c.email?.trim() || null }))

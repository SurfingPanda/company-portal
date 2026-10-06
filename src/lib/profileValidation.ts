export interface ProfileFormValues {
  preferredName: string
  personalEmail: string
  mobileNumber: string
}

export type ProfileErrors = Partial<Record<keyof ProfileFormValues, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phMobilePattern = /^(\+?63|0)9\d{9}$/
/** Digits with an optional leading +, and spaces, dashes or brackets between them. */
const mobilePattern = /^\+?[\d\s\-()]+$/

/** Basic frontend checks only. The Laravel backend must validate again. */
export function validateProfile(values: ProfileFormValues): ProfileErrors {
  const errors: ProfileErrors = {}

  if (values.preferredName.trim().length > 40) errors.preferredName = 'Preferred name must be 40 characters or fewer.'

  const email = values.personalEmail.trim()
  if (email && !emailPattern.test(email)) errors.personalEmail = 'Enter a valid email address.'

  // Optional. When given, accept common Philippine mobile formats (09XXXXXXXXX, +639XXXXXXXXX, 639XXXXXXXXX) with spaces or dashes.
  const mobile = values.mobileNumber.trim()
  if (mobile && !(mobilePattern.test(mobile) && phMobilePattern.test(mobile.replace(/[\s\-()]/g, '')))) {
    errors.mobileNumber = 'Enter a valid Philippine mobile number, e.g. 0917 123 4567 or +63 917 123 4567.'
  }

  return errors
}

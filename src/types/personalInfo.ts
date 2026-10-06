export type CivilStatus = 'single' | 'married' | 'widowed' | 'separated' | 'divorced'

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  alternate_phone: string | null
  email: string | null
}

/** Personal details the employee entered about themselves, plus who to call in an emergency (the first one is called first). */
export interface PersonalInfo {
  date_of_birth: string | null
  civil_status: CivilStatus | null
  /** Colleagues see the birthday (day and month only) on the dashboard. Off unless the employee turns it on. */
  share_birthday: boolean
  /** Colleagues see the work anniversary (from HR's date joined). On unless the employee turns it off. */
  share_anniversary: boolean
  address_line: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  emergency_contacts: EmergencyContact[]
}

export const MAX_EMERGENCY_CONTACTS = 5

export const civilStatusLabels: Record<CivilStatus, string> = {
  single: 'Single', married: 'Married', widowed: 'Widowed', separated: 'Separated', divorced: 'Divorced',
}

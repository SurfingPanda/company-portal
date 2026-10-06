/** One birthday or work anniversary coming up. `date` is the next time it comes round, never a date of birth or a joining date. */
export interface Celebration {
  employee_id: string
  display_name: string
  job_title: string | null
  department: string | null
  is_you: boolean
  date: string
  is_today: boolean
  /** Work anniversaries only. */
  years?: number
}

export interface Celebrations {
  birthdays: Celebration[]
  anniversaries: Celebration[]
}

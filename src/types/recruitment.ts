import type { RequestAttachment, RequestTimelineEntry } from '@/types/request'

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship'
export type WorkArrangement = 'On-site' | 'Hybrid' | 'Remote'
export type JobStatus = 'Open' | 'Closing Soon' | 'Closed' | 'Filled'

/** A job opening. Shaped like a future `GET /api/recruitment/jobs` resource. */
export interface JobOpening {
  id: string
  title: string
  department: string
  location: string
  employmentType: EmploymentType
  workArrangement: WorkArrangement
  summary: string
  responsibilities: string[]
  qualifications: string[]
  preferredQualifications?: string[]
  skills?: string[]
  /** ISO date (yyyy-mm-dd). */
  postedAt: string
  /** ISO date (yyyy-mm-dd). */
  closingDate?: string
  status: JobStatus
  applicationEnabled: boolean
  referralEnabled: boolean
  /** Per-job external application address, if one exists. Never filled with a made-up URL. */
  applicationUrl?: string
  /** True for sample records that are not real vacancies. */
  isSample?: boolean
}

export type JobSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'closing'

/** "open" = Open + Closing Soon (the default view); "all" = every status. */
export type JobStatusFilter = 'open' | 'all' | JobStatus

export interface JobQuery {
  search?: string
  department?: string
  employmentType?: EmploymentType
  workArrangement?: WorkArrangement
  location?: string
  status?: JobStatusFilter
  sort?: JobSort
}

/** Example workflow stages only. Not a claim that ELJIN uses all of them. */
export type ApplicationStatus = 'draft' | 'submitted' | 'under-review' | 'shortlisted' | 'interview' | 'for-assessment' | 'offer' | 'rejected' | 'withdrawn'

export interface ApplicantInfo {
  fullName: string
  email: string
  mobile: string
}

/**
 * An application the signed-in employee submitted. Holds only what the applicant entered:
 * no recruiter notes, scores or rankings (those belong to a future recruitment system).
 */
export interface Application {
  id: string
  /** Display reference, e.g. APP-2026-0001. */
  reference: string
  jobId: string
  jobTitle: string
  department: string
  status: ApplicationStatus
  /** ISO date-time. */
  submittedAt?: string
  /** ISO date-time. */
  updatedAt: string
  applicant: ApplicantInfo
  coverLetter?: string
  skills?: string
  yearsOfExperience?: string
  resume?: RequestAttachment
  timeline: RequestTimelineEntry[]
  isSample?: boolean
}

export interface ApplicationQuery {
  search?: string
  status?: ApplicationStatus
  sort?: 'newest' | 'oldest'
  page?: number
  perPage?: number
}

export interface Referral {
  id: string
  /** Display reference, e.g. REF-2026-0001. */
  reference: string
  jobId: string
  jobTitle: string
  referrer: { name: string; employeeId: string; department: string }
  candidate: ApplicantInfo
  relationship: string
  notes?: string
  resume?: RequestAttachment
  status: 'submitted'
  /** ISO date-time. */
  submittedAt: string
  isSample?: boolean
}

/** Values collected by the application form (`POST /api/recruitment/applications`). */
export interface NewApplicationPayload {
  job: JobOpening
  values: Record<string, string>
  resume: { name: string; size: number; file?: File }
}

/** Values collected by the referral form (`POST /api/recruitment/referrals`). */
export interface NewReferralPayload {
  job: JobOpening
  referrer: Referral['referrer']
  values: Record<string, string>
  resume?: { name: string; size: number }
}

/** `GET /api/recruitment/config`. */
export interface RecruitmentConfig {
  externalApplicationUrl: string
  externalRecruitmentSystemName: string
  externalApplicationEnabled: boolean
}

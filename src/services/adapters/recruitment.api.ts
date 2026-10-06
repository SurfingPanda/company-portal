import { RECRUITMENT_CONFIG } from '@/config/recruitment'
import { buildApplicationTimeline } from '@/lib/recruitment'
import { api } from '@/services/api'
import { toPaginated, type ApiPage } from '@/services/adapters/paginate'
import type { ApiResponse } from '@/types/api'
import type { PaginatedResponse } from '@/types/employee'
import type { Application, ApplicationQuery, ApplicationStatus, EmploymentType, JobOpening, JobQuery, JobStatus, NewApplicationPayload, NewReferralPayload, RecruitmentConfig, Referral } from '@/types/recruitment'

/**
 * Recruitment, Laravel adapter.
 *   GET /api/recruitment/jobs[/{id}], POST /api/recruitment/jobs/{id}/apply | /refer
 *   GET /api/recruitment/applications[/{id}], GET /api/recruitment/referrals
 * Application and referral numbers (APP-/REF-YYYY-NNNN) come from Laravel. The resume is uploaded with the application and
 * stored privately by Laravel (never returned to the browser).
 */

interface ApiJob {
  id: number
  title: string
  department: string
  location: string
  employment_type: string
  work_arrangement: string | null
  summary: string | null
  description: string
  requirements: string[]
  status: string
  application_enabled: boolean
  referral_enabled: boolean
  published_at: string | null
  closing_at: string | null
  is_sample?: boolean
}

interface ApiApplication {
  id: number
  application_number: string
  job?: { id: number; title: string; department: string }
  job_id: number
  applicant_name: string
  email: string
  mobile: string | null
  cover_letter: string | null
  skills: string | null
  experience_summary: string | null
  status: ApplicationStatus
  submitted_at: string | null
  is_sample?: boolean
}

interface ApiReferral {
  id: number
  referral_number: string
  job?: { id: number; title: string; department: string }
  job_id: number
  referred_name: string
  referred_email: string
  referred_mobile: string | null
  relationship: string | null
  notes: string | null
  created_at: string
  is_sample?: boolean
}

const titleCase = (value: string) => value.replace(/(^|-)([a-z])/g, (_, dash: string, c: string) => `${dash}${c.toUpperCase()}`)
const dateOnly = (iso: string | null) => (iso ? iso.slice(0, 10) : undefined)

function toJob(j: ApiJob): JobOpening {
  return {
    id: String(j.id),
    title: j.title,
    department: j.department,
    location: j.location,
    employmentType: titleCase(j.employment_type) as EmploymentType,
    workArrangement: (j.work_arrangement ? titleCase(j.work_arrangement) : 'On-site') as JobOpening['workArrangement'],
    summary: j.summary ?? '',
    responsibilities: j.description.split('\n').map((l) => l.trim()).filter(Boolean),
    qualifications: j.requirements,
    postedAt: dateOnly(j.published_at) ?? '',
    closingDate: dateOnly(j.closing_at),
    status: j.status === 'closing-soon' ? 'Closing Soon' : (titleCase(j.status) as JobStatus),
    applicationEnabled: j.application_enabled,
    referralEnabled: j.referral_enabled,
    isSample: j.is_sample,
  }
}

const toApplication = (a: ApiApplication): Application => {
  const submitted = a.submitted_at ?? undefined
  return {
    id: String(a.id),
    reference: a.application_number,
    jobId: String(a.job_id),
    jobTitle: a.job?.title ?? '',
    department: a.job?.department ?? '',
    status: a.status,
    submittedAt: submitted,
    updatedAt: submitted ?? '',
    applicant: { fullName: a.applicant_name, email: a.email, mobile: a.mobile ?? '' },
    coverLetter: a.cover_letter ?? undefined,
    skills: a.skills ?? undefined,
    yearsOfExperience: a.experience_summary ?? undefined,
    timeline: buildApplicationTimeline(a.status, submitted ?? '', submitted, submitted ?? ''),
    isSample: a.is_sample,
  }
}

const toReferral = (r: ApiReferral): Referral => ({
  id: String(r.id),
  reference: r.referral_number,
  jobId: String(r.job_id),
  jobTitle: r.job?.title ?? '',
  referrer: { name: 'You', employeeId: '', department: '' },
  candidate: { fullName: r.referred_name, email: r.referred_email, mobile: r.referred_mobile ?? '' },
  relationship: r.relationship ?? '',
  notes: r.notes ?? undefined,
  status: 'submitted',
  submittedAt: r.created_at,
  isSample: r.is_sample,
})

export async function getJobs(query: JobQuery = {}): Promise<JobOpening[]> {
  const { search, department, employmentType, workArrangement, location, status = 'open', sort = 'newest' } = query
  const page = await api.get<ApiPage<ApiJob>>('/api/recruitment/jobs', {
    search: search?.trim(), department, employment_type: employmentType?.toLowerCase(), per_page: 100,
  })
  return page.data
    .map(toJob)
    .filter((j) => (workArrangement ? j.workArrangement === workArrangement : true))
    .filter((j) => (location ? j.location === location : true))
    .filter((j) => (status === 'all' ? true : status === 'open' ? j.status === 'Open' || j.status === 'Closing Soon' : j.status === status))
    .sort((a, b) => {
      switch (sort) {
        case 'oldest': return a.postedAt.localeCompare(b.postedAt)
        case 'title-asc': return a.title.localeCompare(b.title)
        case 'title-desc': return b.title.localeCompare(a.title)
        case 'closing': return (a.closingDate ?? '9999-12-31').localeCompare(b.closingDate ?? '9999-12-31')
        default: return b.postedAt.localeCompare(a.postedAt)
      }
    })
}

export async function getLatestJobs(limit = 3): Promise<JobOpening[]> {
  return (await getJobs({ status: 'open', sort: 'newest' })).slice(0, limit)
}

export async function getJob(id: string): Promise<JobOpening | null> {
  try {
    return toJob((await api.get<ApiResponse<ApiJob>>(`/api/recruitment/jobs/${encodeURIComponent(id)}`)).data)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

export async function getApplications(query: ApplicationQuery = {}): Promise<PaginatedResponse<Application>> {
  const page = await api.get<ApiPage<ApiApplication>>('/api/recruitment/applications', {
    search: query.search?.trim(), status: query.status, sort: 'submitted_at', direction: query.sort === 'oldest' ? 'asc' : 'desc',
    page: query.page, per_page: query.perPage ?? 8,
  })
  return toPaginated(page, toApplication)
}

export async function getApplication(id: string): Promise<Application | null> {
  let numeric = id
  if (!/^\d+$/.test(id)) {
    const found = await api.get<ApiPage<ApiApplication>>('/api/recruitment/applications', { search: id, per_page: 5 })
    const match = found.data.find((a) => a.application_number.toLowerCase() === id.toLowerCase())
    if (!match) return null
    numeric = String(match.id)
  }
  try {
    return toApplication((await api.get<ApiResponse<ApiApplication>>(`/api/recruitment/applications/${numeric}`)).data)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

export async function getRecentApplications(limit = 3): Promise<Application[]> {
  return (await getApplications({ perPage: limit })).data
}

export async function submitApplication({ job, values, resume }: NewApplicationPayload): Promise<Application> {
  const fields = {
    applicant_name: values['full-name']?.trim(),
    email: values.email?.trim(),
    mobile: values.mobile?.trim() || undefined,
    cover_letter: values['cover-letter']?.trim() || undefined,
    skills: values.skills?.trim() || undefined,
    experience_summary: values.experience?.trim() || undefined,
  }
  // The resume (PDF, DOC or DOCX, max 5 MB) goes in the same multipart request; Laravel validates it and stores it privately.
  const path = `/api/recruitment/jobs/${encodeURIComponent(job.id)}/apply`
  if (resume.file) {
    const form = new FormData()
    for (const [key, value] of Object.entries(fields)) if (value) form.append(key, value)
    form.append('resume', resume.file)
    return toApplication((await api.upload<ApiResponse<ApiApplication>>(path, form)).data)
  }
  return toApplication((await api.post<ApiResponse<ApiApplication>>(path, fields)).data)
}

export async function getReferrals(): Promise<Referral[]> {
  const page = await api.get<ApiPage<ApiReferral>>('/api/recruitment/referrals', { per_page: 100 })
  return page.data.map(toReferral)
}

export async function submitReferral({ job, referrer, values }: NewReferralPayload): Promise<Referral> {
  const created = await api.post<ApiResponse<ApiReferral>>(`/api/recruitment/jobs/${encodeURIComponent(job.id)}/refer`, {
    referred_name: values['candidate-name']?.trim(),
    referred_email: values['candidate-email']?.trim(),
    referred_mobile: values['candidate-mobile']?.trim() || undefined,
    relationship: values.relationship || undefined,
    notes: values.notes?.trim() || undefined,
  })
  return { ...toReferral(created.data), referrer }
}

export async function getRecruitmentConfig(): Promise<RecruitmentConfig> {
  return RECRUITMENT_CONFIG
}

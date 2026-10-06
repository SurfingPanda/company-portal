import { isApiMode } from '@/services/dataMode'
import * as apiAdapter from '@/services/adapters/recruitment.api'
import { RECRUITMENT_CONFIG } from '@/config/recruitment'
import { sampleApplications } from '@/data/applications'
import { jobs } from '@/data/jobs'
import { sampleReferrals } from '@/data/referrals'
import { applicationStatusLabels, buildApplicationTimeline, makeRecruitmentReference } from '@/lib/recruitment'
import type { PaginatedResponse } from '@/types/employee'
import type { AuthenticatedUser } from '@/types/user'
import type { Application, ApplicationQuery, JobOpening, JobQuery, NewApplicationPayload, NewReferralPayload, RecruitmentConfig, Referral } from '@/types/recruitment'

/**
 * Service layer for Recruitment & Careers.
 *
 *   getJobs / getJob / getLatestJobs    GET  /api/recruitment/jobs, /api/recruitment/jobs/{id}
 *   getApplications / getApplication    GET  /api/recruitment/applications, /api/recruitment/applications/{id}
 *   submitApplication                   POST /api/recruitment/applications (+ POST .../{id}/resume for the file)
 *   getReferrals / submitReferral       GET  /api/recruitment/referrals    POST /api/recruitment/referrals
 *   getRecruitmentConfig                GET  /api/recruitment/config
 *
 * This is NOT an applicant tracking system. Applications and referrals are kept in memory only and vanish on
 * reload. A real backend must return only the signed-in user's own applications and referrals, and must never
 * expose recruiter notes, other applicants' data or resumes.
 */

const MOCK_LATENCY_MS = 220
const wait = (ms = MOCK_LATENCY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms))

let applicationStore: Application[] = [...sampleApplications]
let referralStore: Referral[] = [...sampleReferrals]
const savedJobIds = new Set<string>()

const pad = (n: number) => String(n).padStart(2, '0')
const nowIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`)

const matches = (haystack: string, search: string) =>
  search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.toLowerCase().includes(term))

/** GET /api/recruitment/jobs. Search covers job data only (title, department, location, keywords). */
async function mockGetJobs(query: JobQuery = {}): Promise<JobOpening[]> {
  await wait()
  const { search, department, employmentType, workArrangement, location, status = 'open', sort = 'newest' } = query

  return jobs
    .filter((j) => (search?.trim() ? matches([j.title, j.department, j.location, j.summary, ...(j.skills ?? []), ...j.responsibilities].join(' '), search) : true))
    .filter((j) => (department ? j.department === department : true))
    .filter((j) => (employmentType ? j.employmentType === employmentType : true))
    .filter((j) => (workArrangement ? j.workArrangement === workArrangement : true))
    .filter((j) => (location ? j.location === location : true))
    .filter((j) => (status === 'all' ? true : status === 'open' ? j.status === 'Open' || j.status === 'Closing Soon' : j.status === status))
    .sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.postedAt.localeCompare(b.postedAt)
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        case 'closing':
          // Soonest closing date first; jobs without one go last.
          return (a.closingDate ?? '9999-12-31').localeCompare(b.closingDate ?? '9999-12-31')
        default:
          return b.postedAt.localeCompare(a.postedAt)
      }
    })
}

/** Newest positions that are still accepting candidates. */
async function mockGetLatestJobs(limit = 3): Promise<JobOpening[]> {
  const open = await getJobs({ status: 'open', sort: 'newest' })
  return open.slice(0, limit)
}

/** GET /api/recruitment/jobs/{id} */
async function mockGetJob(id: string): Promise<JobOpening | null> {
  await wait()
  return jobs.find((j) => j.id === id) ?? null
}

/** Saved jobs are a simple in-memory toggle (no account storage yet). */
export const isJobSaved = (id: string) => savedJobIds.has(id)
export function toggleSavedJob(id: string): boolean {
  if (savedJobIds.has(id)) savedJobIds.delete(id)
  else savedJobIds.add(id)
  return savedJobIds.has(id)
}

/** GET /api/recruitment/applications (the signed-in user's own applications). */
async function mockGetApplications(query: ApplicationQuery = {}): Promise<PaginatedResponse<Application>> {
  await wait()
  const { search, status, sort = 'newest', page = 1, perPage = 8 } = query

  const filtered = applicationStore
    .filter((a) => (search?.trim() ? matches([a.reference, a.jobTitle, a.department, applicationStatusLabels[a.status]].join(' '), search) : true))
    .filter((a) => (status ? a.status === status : true))
    .sort((a, b) => {
      const left = a.submittedAt ?? a.updatedAt
      const right = b.submittedAt ?? b.updatedAt
      return sort === 'oldest' ? left.localeCompare(right) : right.localeCompare(left)
    })

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * perPage
  return { data: filtered.slice(start, start + perPage), current_page: currentPage, per_page: perPage, total, last_page: lastPage }
}

/** GET /api/recruitment/applications/{id} */
async function mockGetApplication(id: string): Promise<Application | null> {
  await wait()
  return applicationStore.find((a) => a.id.toLowerCase() === id.toLowerCase()) ?? null
}

async function mockGetRecentApplications(limit = 3): Promise<Application[]> {
  const page = await getApplications({ perPage: limit })
  return page.data
}

const nextSequence = (prefix: string, references: string[]) => references.filter((r) => r.startsWith(`${prefix}-`)).reduce((max, r) => Math.max(max, Number(r.slice(-4))), 0) + 1

/** POST /api/recruitment/applications. Mock only: nothing is sent anywhere and the file is not stored. */
async function mockSubmitApplication({ job, values, resume }: NewApplicationPayload): Promise<Application> {
  await wait(800)
  const now = nowIso()
  const reference = makeRecruitmentReference('APP', new Date().getFullYear(), nextSequence('APP', applicationStore.map((a) => a.reference)))

  const application: Application = {
    id: reference,
    reference,
    jobId: job.id,
    jobTitle: job.title,
    department: job.department,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
    applicant: { fullName: values['full-name'].trim(), email: values.email.trim(), mobile: values.mobile.trim() },
    coverLetter: values['cover-letter']?.trim() || undefined,
    skills: values.skills?.trim() || undefined,
    yearsOfExperience: values.experience?.trim(),
    resume: { id: `res-${reference}`, name: resume.name, size: formatSize(resume.size) },
    timeline: buildApplicationTimeline('submitted', now, now, now),
    isSample: true,
  }
  applicationStore = [application, ...applicationStore]
  return application
}

/** GET /api/recruitment/referrals */
async function mockGetReferrals(): Promise<Referral[]> {
  await wait()
  return [...referralStore].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

/** POST /api/recruitment/referrals. Mock only; there is no referral processing workflow yet. */
async function mockSubmitReferral({ job, referrer, values, resume }: NewReferralPayload): Promise<Referral> {
  await wait(800)
  const reference = makeRecruitmentReference('REF', new Date().getFullYear(), nextSequence('REF', referralStore.map((r) => r.reference)))

  const referral: Referral = {
    id: reference,
    reference,
    jobId: job.id,
    jobTitle: job.title,
    referrer,
    candidate: { fullName: values['candidate-name'].trim(), email: values['candidate-email'].trim(), mobile: values['candidate-mobile']?.trim() ?? '' },
    relationship: values.relationship,
    notes: values.notes?.trim() || undefined,
    resume: resume ? { id: `res-${reference}`, name: resume.name, size: formatSize(resume.size) } : undefined,
    status: 'submitted',
    submittedAt: nowIso(),
    isSample: true,
  }
  referralStore = [referral, ...referralStore]
  return referral
}

/** GET /api/recruitment/config */
async function mockGetRecruitmentConfig(): Promise<RecruitmentConfig> {
  await wait(50)
  return RECRUITMENT_CONFIG
}

/** The referring employee comes from the centralized mock user (never typed in by hand). */
export const getReferrerFromUser = (user: Pick<AuthenticatedUser, 'firstName' | 'lastName' | 'employeeId' | 'departmentName'>): Referral['referrer'] => ({
  name: `${user.firstName} ${user.lastName}`,
  employeeId: user.employeeId,
  department: user.departmentName,
})

// --- Data source: Laravel API in API mode, the sample data above in mock mode. Pages and hooks never see the difference. ---
export const getJobs: typeof mockGetJobs = isApiMode ? apiAdapter.getJobs : mockGetJobs
export const getLatestJobs: typeof mockGetLatestJobs = isApiMode ? apiAdapter.getLatestJobs : mockGetLatestJobs
export const getJob: typeof mockGetJob = isApiMode ? apiAdapter.getJob : mockGetJob
export const getApplications: typeof mockGetApplications = isApiMode ? apiAdapter.getApplications : mockGetApplications
export const getApplication: typeof mockGetApplication = isApiMode ? apiAdapter.getApplication : mockGetApplication
export const getRecentApplications: typeof mockGetRecentApplications = isApiMode ? apiAdapter.getRecentApplications : mockGetRecentApplications
export const submitApplication: typeof mockSubmitApplication = isApiMode ? apiAdapter.submitApplication : mockSubmitApplication
export const getReferrals: typeof mockGetReferrals = isApiMode ? apiAdapter.getReferrals : mockGetReferrals
export const submitReferral: typeof mockSubmitReferral = isApiMode ? apiAdapter.submitReferral : mockSubmitReferral
export const getRecruitmentConfig: typeof mockGetRecruitmentConfig = isApiMode ? apiAdapter.getRecruitmentConfig : mockGetRecruitmentConfig

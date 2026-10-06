import { RECRUITMENT_CONFIG } from '@/config/recruitment'
import type { ApplicationStatus, JobOpening, JobStatus } from '@/types/recruitment'
import type { RequestTimelineEntry } from '@/types/request'

/** Display names for example application stages. They are not an official ELJIN process. */
export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  'under-review': 'Under Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  'for-assessment': 'For Assessment',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export const jobStatusOptions: JobStatus[] = ['Open', 'Closing Soon', 'Closed', 'Filled']

/** People can only apply to or refer for positions that are still accepting candidates. */
export const isJobAcceptingCandidates = (job: Pick<JobOpening, 'status'>) => job.status === 'Open' || job.status === 'Closing Soon'

export const canApply = (job: JobOpening) => job.applicationEnabled && isJobAcceptingCandidates(job)
export const canRefer = (job: JobOpening) => job.referralEnabled && isJobAcceptingCandidates(job)

/** APP-2026-0001 / REF-2026-0001 style reference. */
export const makeRecruitmentReference = (prefix: 'APP' | 'REF', year: number, sequence: number) => `${prefix}-${year}-${String(sequence).padStart(4, '0')}`

const RECRUITMENT = 'Recruitment'

/**
 * Display timeline derived from a status (Application Created → Submitted → Under Review → Recruitment Update).
 * Not a workflow engine: a future recruitment backend supplies the real entries.
 */
export function buildApplicationTimeline(status: ApplicationStatus, createdAt: string, submittedAt: string | undefined, updatedAt: string): RequestTimelineEntry[] {
  const created: RequestTimelineEntry = { id: 't-created', label: 'Application Created', state: 'done', timestamp: createdAt, actor: 'Employee Portal' }
  const pending = (id: string, label: string): RequestTimelineEntry => ({ id, label, state: 'pending' })

  if (status === 'draft' || !submittedAt) return [{ ...created, state: 'current', description: 'Not yet submitted.' }]

  const submitted: RequestTimelineEntry = { id: 't-submitted', label: 'Submitted', state: 'done', timestamp: submittedAt, description: 'Application received.', actor: 'Employee Portal' }
  const review = (state: 'done' | 'current'): RequestTimelineEntry => ({ id: 't-review', label: 'Under Review', state, timestamp: updatedAt, actor: RECRUITMENT })
  const update = (state: 'done' | 'current'): RequestTimelineEntry => ({ id: 't-update', label: `Recruitment Update: ${applicationStatusLabels[status]}`, state, timestamp: updatedAt, actor: RECRUITMENT })

  switch (status) {
    case 'submitted':
      return [created, submitted, pending('t-review', 'Under Review'), pending('t-update', 'Recruitment Update')]
    case 'under-review':
      return [created, submitted, review('current'), pending('t-update', 'Recruitment Update')]
    case 'withdrawn':
      return [created, submitted, update('done')]
    default:
      // shortlisted, interview, for-assessment, offer, rejected
      return [created, submitted, review('done'), update(status === 'rejected' ? 'done' : 'current')]
  }
}

/** External application address for a job: its own URL, else the configured recruitment system. Empty = use the portal's demo flow. */
export const getExternalApplicationUrl = (job: Pick<JobOpening, 'applicationUrl'>) => job.applicationUrl?.trim() || RECRUITMENT_CONFIG.externalApplicationUrl

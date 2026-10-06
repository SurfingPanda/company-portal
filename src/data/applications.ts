import { currentUser } from '@/data/currentUser'
import { jobs } from '@/data/jobs'
import { buildApplicationTimeline } from '@/lib/recruitment'
import type { Application, ApplicationStatus } from '@/types/recruitment'

/**
 * SAMPLE DATA — NOT REAL APPLICATIONS.
 *
 * These belong to the mock signed-in employee. They hold only what an applicant would enter
 * themselves: no recruiter notes, scores or rankings. Replaced by `GET /api/recruitment/applications`
 * (the signed-in user's own applications only) once a recruitment backend exists.
 */

function sample(n: number, jobId: string, status: ApplicationStatus, submittedAt: string | undefined, updatedAt: string, resumeName?: string): Application {
  const job = jobs.find((j) => j.id === jobId)!
  const reference = `APP-2026-${String(n).padStart(4, '0')}`
  return {
    id: reference,
    reference,
    jobId,
    jobTitle: job.title,
    department: job.department,
    status,
    submittedAt,
    updatedAt,
    applicant: { fullName: `${currentUser.firstName} ${currentUser.lastName}`, email: 'applicant.sample@example.com', mobile: '+63 900 000 0000' },
    coverLetter: 'Sample cover letter text.',
    skills: 'Sample skills text.',
    yearsOfExperience: '3',
    resume: resumeName ? { id: `res-${n}`, name: resumeName, size: '180 KB' } : undefined,
    timeline: buildApplicationTimeline(status, submittedAt ?? updatedAt, submittedAt, updatedAt),
    isSample: true,
  }
}

export const sampleApplications: Application[] = [
  sample(1, 'job-002', 'under-review', '2026-09-25T10:15:00', '2026-09-29T14:30:00', 'sample-resume.pdf'),
  sample(2, 'job-004', 'submitted', '2026-09-30T08:45:00', '2026-09-30T08:45:00', 'sample-resume.pdf'),
  sample(3, 'job-008', 'shortlisted', '2026-09-12T13:20:00', '2026-09-26T09:10:00', 'sample-resume.docx'),
  sample(4, 'job-005', 'rejected', '2026-08-20T11:00:00', '2026-09-02T15:40:00', 'sample-resume.pdf'),
  sample(5, 'job-006', 'withdrawn', '2026-08-28T09:30:00', '2026-09-01T10:05:00', 'sample-resume.pdf'),
  sample(6, 'job-010', 'draft', undefined, '2026-09-30T17:20:00'),
]

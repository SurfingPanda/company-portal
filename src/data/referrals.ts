import { currentUser } from '@/data/currentUser'
import { jobs } from '@/data/jobs'
import type { Referral } from '@/types/recruitment'

/**
 * SAMPLE DATA — NOT REAL REFERRALS.
 *
 * Candidate names and contact details are fictional placeholders. Replaced by
 * `GET /api/recruitment/referrals` (the signed-in employee's own referrals only) later.
 */

const referrer = { name: `${currentUser.firstName} ${currentUser.lastName}`, employeeId: currentUser.employeeId, department: currentUser.departmentName }

function sample(n: number, jobId: string, candidateName: string, relationship: string, submittedAt: string): Referral {
  const job = jobs.find((j) => j.id === jobId)!
  const reference = `REF-2026-${String(n).padStart(4, '0')}`
  return {
    id: reference,
    reference,
    jobId,
    jobTitle: job.title,
    referrer,
    candidate: { fullName: candidateName, email: 'candidate.sample@example.com', mobile: '+63 900 000 0001' },
    relationship,
    notes: 'Sample referral note.',
    status: 'submitted',
    submittedAt,
    isSample: true,
  }
}

export const sampleReferrals: Referral[] = [
  sample(1, 'job-001', 'Sample Candidate One', 'Former colleague', '2026-09-20T10:00:00'),
  sample(2, 'job-005', 'Sample Candidate Two', 'Friend', '2026-09-27T15:30:00'),
]

import type { AdminPolicy, PolicySummary } from '@/types/policy'

/** What the employee's own status reads as; the word is always shown, so colour is never the only signal. */
export const policyStatusLabel = (p: Pick<PolicySummary, 'status' | 'previously_acknowledged_version'>) =>
  p.status === 'acknowledged' ? 'Read' : p.status === 'overdue' ? 'Overdue' : p.previously_acknowledged_version ? 'Updated: read again' : 'To read'

/** StatusBadge word for an employee's status. */
export const policyStatusTone = (status: PolicySummary['status']) => (status === 'acknowledged' ? 'completed' : status === 'overdue' ? 'rejected' : 'pending')

export const audienceLabel = (p: Pick<AdminPolicy, 'audience' | 'departments'>) =>
  p.audience === 'all' ? 'All employees' : p.audience === 'managers' ? 'Managers' : p.departments.length ? p.departments.join(', ') : 'Departments'

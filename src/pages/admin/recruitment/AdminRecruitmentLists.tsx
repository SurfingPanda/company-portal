import { AdminFilters } from '@/components/admin/AdminFilters'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { useAdminList } from '@/hooks/useAdminList'
import { formatDateTime } from '@/lib/format'
import { adminApi } from '@/services/admin/adminApi'
import type { AdminRecord } from '@/types/admin'

const s = (r: AdminRecord, k: string) => String(r[k] ?? '')
const statuses = ['submitted', 'under-review', 'shortlisted', 'interview', 'for-assessment', 'offer', 'rejected', 'withdrawn'].map((v) => ({ value: v, label: v.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) }))

/** Read-only list of applications. Applicant-provided details only: there is no scoring, ranking or recruiter workflow. */
export function AdminApplicationsPage() {
  const list = useAdminList<AdminRecord>((p) => adminApi.list<AdminRecord>('/api/admin/recruitment/applications', p), ['status'], { sort: 'submitted_at', direction: 'desc' })
  const columns: AdminColumn<AdminRecord>[] = [
    { key: 'n', header: 'Application', render: (r) => <span className="font-mono">{s(r, 'application_number')}</span> },
    { key: 'applicant', header: 'Applicant', render: (r) => <span className="font-medium">{s(r, 'applicant_name')}</span> },
    { key: 'email', header: 'Email', render: (r) => s(r, 'email') },
    { key: 'job', header: 'Position', render: (r) => s(r, 'job') },
    { key: 'resume', header: 'Resume', render: (r) => (r.has_resume === true ? 'Received' : 'None') },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={s(r, 'status')} /> },
    { key: 'at', header: 'Submitted', sortKey: 'submitted_at', render: (r) => (r.submitted_at ? formatDateTime(s(r, 'submitted_at')) : '—') },
  ]
  return (
    <>
      <AdminPageHeader title="Applications" description="Applications submitted by employees. View only." trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Applications' }]} />
      <AdminFilters search={list.search} searchLabel="Search number, name or email" filters={[{ key: 'status', label: 'Status', options: statuses }]} values={list.params} onChange={list.update} />
      <AdminTable caption="Applications" columns={columns} page={list.data} loading={list.loading} error={list.error} onRetry={list.retry} rowKey={(r) => r.id}
        sort={String(list.params.sort ?? '')} direction={list.params.direction as 'asc' | 'desc' | undefined}
        onSort={(key) => list.update({ sort: key, direction: list.params.direction === 'asc' ? 'desc' : 'asc' })}
        onPage={(page) => list.update({ page: String(page) })} emptyTitle="No applications found" emptyHint="No one has applied yet, or none match the filters." />
    </>
  )
}

export function AdminReferralsPage() {
  const list = useAdminList<AdminRecord>((p) => adminApi.list<AdminRecord>('/api/admin/recruitment/referrals', p), [], { sort: 'created_at', direction: 'desc' })
  const columns: AdminColumn<AdminRecord>[] = [
    { key: 'n', header: 'Referral', render: (r) => <span className="font-mono">{s(r, 'referral_number')}</span> },
    { key: 'name', header: 'Candidate', render: (r) => <span className="font-medium">{s(r, 'referred_name')}</span> },
    { key: 'email', header: 'Candidate email', render: (r) => s(r, 'referred_email') },
    { key: 'job', header: 'Position', render: (r) => s(r, 'job') },
    { key: 'by', header: 'Referred by', render: (r) => s(r, 'referred_by') },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={s(r, 'status')} /> },
    { key: 'at', header: 'Submitted', sortKey: 'created_at', render: (r) => (r.created_at ? formatDateTime(s(r, 'created_at')) : '—') },
  ]
  return (
    <>
      <AdminPageHeader title="Referrals" description="Candidates referred by employees. View only." trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Referrals' }]} />
      <AdminFilters search={list.search} searchLabel="Search number or name" values={list.params} onChange={list.update} />
      <AdminTable caption="Referrals" columns={columns} page={list.data} loading={list.loading} error={list.error} onRetry={list.retry} rowKey={(r) => r.id}
        sort={String(list.params.sort ?? '')} direction={list.params.direction as 'asc' | 'desc' | undefined}
        onSort={(key) => list.update({ sort: key, direction: list.params.direction === 'asc' ? 'desc' : 'asc' })}
        onPage={(page) => list.update({ page: String(page) })} emptyTitle="No referrals found" emptyHint="No referrals have been submitted yet." />
    </>
  )
}

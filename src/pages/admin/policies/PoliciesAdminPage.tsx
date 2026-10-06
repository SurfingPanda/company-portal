import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ProgressBar } from '@/components/admin/ProgressBar'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/format'
import { audienceLabel } from '@/lib/policies'
import { getAdminPolicies } from '@/services/policyService'

/** HR: all policies, how many people have confirmed each, and where to publish a new one. */
export default function PoliciesAdminPage() {
  const [status, setStatus] = useState('')
  const { data, error, loading, retry } = useAsync(() => getAdminPolicies({ per_page: 100, sort: 'updated_at', direction: 'desc', status: status || undefined }), [status])

  return (
    <>
      <AdminPageHeader
        title="Policies"
        description="Publish a policy, and see who has confirmed they read it. A new version asks everyone again."
        trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Policies' }]}
        actions={<Button asChild><Link to="/admin/policies/create"><Plus aria-hidden="true" /> New policy</Link></Button>}
      />

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="policy-status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
        <select id="policy-status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 border border-input bg-white px-2 text-sm">
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error ? (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Unable to load policies.</p>
          <Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button>
        </div>
      ) : !data && loading ? (
        <Skeleton className="h-48" />
      ) : data && data.data.length === 0 ? (
        <p role="status" className="border border-dashed border-muted-foreground/40 bg-white p-6 text-sm text-muted-foreground">No policies yet. Create one, then publish it to ask employees to read it.</p>
      ) : (
        <div className={`overflow-x-auto border bg-white ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Policy</th><th className="p-3">Status</th><th className="p-3">For</th><th className="p-3">Read it</th><th className="p-3">Due</th><th className="p-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {data?.data.map((p) => (
                <tr key={p.id} className="border-t align-top">
                  <td className="p-3">
                    <span className="font-medium">{p.title}</span>
                    <span className="block text-xs text-muted-foreground">Version {p.version}</span>
                  </td>
                  <td className="p-3"><StatusBadge value={p.status} /></td>
                  <td className="p-3 text-muted-foreground">{audienceLabel(p)}</td>
                  <td className="p-3">
                    {p.progress ? (
                      <Link to={`/admin/policies/${p.id}/report`} className="block no-underline hover:underline">
                        <span className="text-sm">{p.progress.acknowledged} of {p.progress.required}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{p.progress.percent}%</span>
                        <span className="mt-1 block"><ProgressBar percent={p.progress.percent} /></span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{p.due_date ? formatDate(p.due_date, 'long') : '—'}</td>
                  <td className="p-3 text-right">
                    <span className="inline-flex gap-2">
                      {p.status === 'published' && <Button asChild size="sm" variant="outline" className="bg-white"><Link to={`/admin/policies/${p.id}/report`}>Who has read it</Link></Button>}
                      <Button asChild size="sm" variant="outline" className="bg-white"><Link to={`/admin/policies/${p.id}/edit`}>Edit</Link></Button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SectionHeading } from '@/components/common/SectionHeading'
import { CommonIssues } from '@/components/helpdesk/CommonIssues'
import { HelpdeskPageShell } from '@/components/helpdesk/HelpdeskPageShell'
import { HelpdeskQuickActions } from '@/components/helpdesk/HelpdeskQuickActions'
import { HelpdeskSearch } from '@/components/helpdesk/HelpdeskSearch'
import { HelpdeskErrorState, ListSkeleton, SampleHelpdeskNotice } from '@/components/helpdesk/HelpdeskStates'
import { ITSupportContact } from '@/components/helpdesk/ITSupportContact'
import { KnowledgeBaseList } from '@/components/helpdesk/KnowledgeBaseList'
import { useAsync } from '@/hooks/useAsync'
import { getFeaturedArticles } from '@/services/helpdeskService'

export default function HelpdeskPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: featured, error, retry } = useAsync(() => getFeaturedArticles(4), [])

  const openSearch = () => {
    const q = search.trim()
    navigate(q ? `/helpdesk/knowledge-base?q=${encodeURIComponent(q)}` : '/helpdesk/knowledge-base')
  }

  return (
    <HelpdeskPageShell title="IT Helpdesk" description="Get help with computers, systems, accounts, network access, and other IT services.">
      <div className="space-y-10">
        <SampleHelpdeskNotice />

        <div className="border bg-white p-4 sm:p-5">
          <HelpdeskSearch value={search} onChange={setSearch} onSubmit={openSearch} />
          <p className="mt-2 text-xs text-muted-foreground">Try: password reset, Wi-Fi, printer, MFA, VPN, email, computer slow.</p>
        </div>

        <section aria-labelledby="quick-actions-heading">
          <SectionHeading id="quick-actions-heading" title="Support Quick Actions" />
          <HelpdeskQuickActions />
        </section>

        <CommonIssues />

        <section aria-labelledby="popular-articles-heading">
          <SectionHeading id="popular-articles-heading" title="Popular Help Articles" />
          {error ? <HelpdeskErrorState onRetry={retry} /> : !featured ? <ListSkeleton rows={3} label="Loading articles" /> : <KnowledgeBaseList articles={featured} />}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ITSupportContact />
          </div>
          <aside className="border bg-white p-5 text-sm">
            <h2 className="font-serif text-lg font-semibold text-primary">Other employee requests</h2>
            <p className="mt-1 text-muted-foreground">Looking for another employee request?</p>
            <Link to="/forms" className="mt-2 inline-block font-medium text-primary underline-offset-4 hover:underline">
              View Forms &amp; Requests
            </Link>
          </aside>
        </div>
      </div>
    </HelpdeskPageShell>
  )
}

import { Link } from 'react-router-dom'
import { HREmptyState, HRErrorState, HRListSkeleton, HRSection, SampleHRNotice } from '@/components/hr/HRStates'
import { DocumentPreviewList } from '@/components/resources/DocumentPreviewList'
import { ResourceLinkList, ResourcesPageShell } from '@/components/resources/ResourcesPageShell'
import { Button } from '@/components/ui/button'
import { itServiceLinks } from '@/data/resources'
import { useAsync } from '@/hooks/useAsync'
import { getArticles } from '@/services/helpdeskService'

/** IT guides are the existing Helpdesk knowledge-base articles and IT documents; nothing is copied here. */
function GuideList() {
  const { data, error, retry } = useAsync(() => getArticles({}), [])
  if (error) return <HRErrorState onRetry={retry} />
  if (!data) return <HRListSkeleton rows={4} label="Loading IT guides" />
  if (data.length === 0) return <HREmptyState title="No guides yet" message="IT guides have not yet been published." />
  const guides = data.filter((a) => a.isFeatured).concat(data.filter((a) => !a.isFeatured)).slice(0, 7)

  return (
    <div>
      <ul aria-label="IT guides" className="divide-y border bg-white">
        {guides.map((a) => (
          <li key={a.id}>
            <Link to={`/helpdesk/knowledge-base/${a.id}`} className="block px-4 py-2.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
              <span className="font-medium text-primary hover:underline">{a.title}</span>
              <span className="block text-xs text-muted-foreground">{a.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs">
        <Link to="/helpdesk/knowledge-base" className="font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline">
          All guides →
        </Link>
      </p>
    </div>
  )
}

export default function ITResourcesPage() {
  return (
    <ResourcesPageShell title="IT Resources" description="IT services, guides and where to get help." current="IT">
      <div className="space-y-10">
        <SampleHRNotice text="IT guides are generic sample articles, not official ELJIN procedures." />
        <div className="grid gap-10 lg:grid-cols-2">
          <HRSection id="it-res-services-heading" title="IT Services">
            <ResourceLinkList label="IT services" links={itServiceLinks} />
          </HRSection>
          <HRSection id="it-res-docs-heading" title="IT Documents">
            <DocumentPreviewList category="it" label="IT documents" viewAllHref="/documents?category=it" limit={5} />
          </HRSection>
        </div>

        <HRSection id="it-res-guides-heading" title="IT Guides">
          <GuideList />
        </HRSection>

        <section aria-labelledby="it-help-heading" className="border border-l-4 border-l-primary bg-white p-5">
          <h2 id="it-help-heading" className="font-serif text-xl font-semibold text-primary">
            Can&apos;t find what you need?
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link to="/helpdesk/new">Submit IT Request</Link>
            </Button>
            <Button asChild variant="outline" className="bg-white">
              <Link to="/helpdesk/knowledge-base">Browse Knowledge Base</Link>
            </Button>
            <Button asChild variant="outline" className="bg-white">
              <Link to={'/contact-mis'}>Contact IT Support</Link>
            </Button>
          </div>
        </section>
      </div>
    </ResourcesPageShell>
  )
}

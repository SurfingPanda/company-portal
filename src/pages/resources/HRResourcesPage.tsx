import { Link } from 'react-router-dom'
import { HRSection, SampleHRNotice } from '@/components/hr/HRStates'
import { DocumentPreviewList } from '@/components/resources/DocumentPreviewList'
import { ResourceFAQItem } from '@/components/resources/ResourceFAQItem'
import { ResourceLinkList, ResourcesPageShell } from '@/components/resources/ResourcesPageShell'
import { hrDocumentLinks, hrServiceLinks } from '@/data/resources'
import { useAsync } from '@/hooks/useAsync'
import { getResourceFaqs } from '@/services/resourceService'

export default function HRResourcesPage() {
  const { data: faqs } = useAsync(() => getResourceFaqs({ category: 'hr' }), [])

  return (
    <ResourcesPageShell title="HR Resources" description="HR services, documents and common questions, with links to where each one lives." current="HR">
      <div className="space-y-10">
        <SampleHRNotice text="These links point to existing portal modules. Linked documents and services are sample records until HR publishes official content." />
        <div className="grid gap-10 lg:grid-cols-2">
          <HRSection id="hr-res-services-heading" title="HR Services">
            <ResourceLinkList label="HR services" links={hrServiceLinks} />
          </HRSection>
          <HRSection id="hr-res-docs-heading" title="HR Documents">
            <ResourceLinkList label="HR document categories" links={hrDocumentLinks} />
            <div className="mt-4">
              <DocumentPreviewList category="hr" label="HR documents" viewAllHref="/documents?category=hr" limit={4} />
            </div>
          </HRSection>
        </div>
        <HRSection id="hr-res-faq-heading" title="HR FAQs">
          <ul aria-label="HR frequently asked questions" className="divide-y border bg-white">
            {(faqs ?? []).slice(0, 4).map((f) => (
              <li key={f.id}>
                <ResourceFAQItem faq={f} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs">
            <Link to="/resources/faq?category=hr" className="font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline">
              More HR questions →
            </Link>
          </p>
        </HRSection>
      </div>
    </ResourcesPageShell>
  )
}

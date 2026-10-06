import { Link } from 'react-router-dom'
import { SectionHeading } from '@/components/common/SectionHeading'
import { commonIssues } from '@/data/helpdeskOptions'

/** Generic IT topics. Each opens the knowledge base filtered to that topic. */
export function CommonIssues() {
  return (
    <section aria-labelledby="common-issues-heading">
      <SectionHeading id="common-issues-heading" title="Common Issues" description="Generic IT topics. Pick one to see related help articles." />
      <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {commonIssues.map((issue) => (
          <li key={issue.label} className="border-b border-border">
            <Link
              to={issue.href}
              className="group flex items-center justify-between py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:-mx-2 sm:px-2"
            >
              <span className="group-hover:underline">{issue.label}</span>
              <span aria-hidden="true" className="text-muted-foreground group-hover:text-gold">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

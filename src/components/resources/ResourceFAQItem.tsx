import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resourceFaqCategoryLabels } from '@/data/resourceFaq'
import type { ResourceFAQ } from '@/types/resource'

/** One FAQ as a native <details> accordion (keyboard operable). The answer links to the module that handles the topic. */
export function ResourceFAQItem({ faq }: { faq: ResourceFAQ }) {
  return (
    <details className="group px-4 py-3">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <span>
          <span className="mb-0.5 block text-[0.6875rem] font-semibold uppercase tracking-widest text-gold">{resourceFaqCategoryLabels[faq.category]}</span>
          {faq.question}
        </span>
        <ChevronDown className="mt-1 size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/85">{faq.answer}</p>
      {faq.relatedRoute && (
        <p className="mt-2 text-sm">
          <Link to={faq.relatedRoute} className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
            Go there →
          </Link>
        </p>
      )}
    </details>
  )
}

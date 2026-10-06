import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { BenefitFAQ as Faq } from '@/types/benefit'

/**
 * FAQ accordion built on native <details>/<summary>: keyboard operable (Tab, Enter, Space) and announced by screen readers.
 * Answers come from data; nothing is hard-coded here.
 */
export function BenefitFAQ({ faqs }: { faqs: Faq[] }) {
  return (
    <ul aria-label="Frequently asked questions" className="divide-y border bg-white">
      {faqs.map((faq) => (
        <li key={faq.id}>
          <details className="group px-4 py-3">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
              <span>
                {faq.category && <span className="mb-0.5 block text-[0.6875rem] font-semibold uppercase tracking-widest text-gold">{faq.category}</span>}
                {faq.question}
              </span>
              <ChevronDown className="mt-1 size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/85">{faq.answer}</p>
            {(faq.relatedBenefitId || faq.relatedDocumentId) && (
              <p className="mt-2 flex flex-wrap gap-x-4 text-xs">
                {faq.relatedBenefitId && (
                  <Link to={`/benefits/${faq.relatedBenefitId}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    Related benefit
                  </Link>
                )}
                {faq.relatedDocumentId && (
                  <Link to={`/documents/${faq.relatedDocumentId}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    Related document
                  </Link>
                )}
              </p>
            )}
          </details>
        </li>
      ))}
    </ul>
  )
}

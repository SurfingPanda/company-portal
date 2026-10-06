import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { BenefitStatus } from '@/components/benefits/BenefitStatus'
import { Button } from '@/components/ui/button'
import { getBenefitCategoryLabel } from '@/services/benefitService'
import type { EmployeeBenefit } from '@/types/benefit'

/** Compact benefit entry: category, name, status, short description, View Details. No amounts, percentages or eligibility. */
export function BenefitCard({ benefit }: { benefit: EmployeeBenefit }) {
  return (
    <article className="flex h-full flex-col border bg-white p-4">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-gold">{getBenefitCategoryLabel(benefit.category)}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="font-serif text-lg font-semibold leading-tight text-primary">{benefit.name}</h3>
        {benefit.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
      </div>
      <p className="mt-1 text-[0.8125rem] leading-snug text-muted-foreground">{benefit.shortDescription}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3 mt-4">
        <BenefitStatus status={benefit.status} />
        <Button asChild variant="outline" size="sm" className="bg-white text-primary">
          <Link to={`/benefits/${benefit.id}`} aria-label={`View details: ${benefit.name}`}>
            View Details
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  )
}

import { Link } from 'react-router-dom'
import { BenefitAssistance } from '@/components/benefits/BenefitAssistance'
import { BenefitsPageShell } from '@/components/benefits/BenefitsPageShell'
import { HRErrorState, HRListSkeleton, HRSection } from '@/components/hr/HRStates'
import { useAsync } from '@/hooks/useAsync'
import { getBenefitResourceGroups } from '@/services/benefitService'

const rowClass = 'block px-4 py-2.5 text-sm font-medium text-primary hover:bg-accent hover:underline focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

export default function BenefitsResourcesPage() {
  const { data, error, retry } = useAsync(getBenefitResourceGroups, [])

  return (
    <BenefitsPageShell title="Benefit Resources" description="Documents, forms, HR services and more, all in their own modules." trail={[{ label: 'Resources' }]}>
      <div className="space-y-10">
        {error ? (
          <HRErrorState onRetry={retry} />
        ) : !data ? (
          <HRListSkeleton rows={4} label="Loading resources" />
        ) : (
          <div className="grid gap-10 md:grid-cols-2">
            {data.map((group) => (
              <HRSection key={group.id} id={`resources-${group.id}`} title={group.title}>
                <p className="mb-3 text-sm text-muted-foreground">{group.description}</p>
                <ul className="divide-y border bg-white" aria-label={group.title}>
                  {group.links.map((l) => (
                    <li key={l.href}>
                      <Link to={l.href} className={rowClass}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </HRSection>
            ))}
          </div>
        )}
        <BenefitAssistance />
      </div>
    </BenefitsPageShell>
  )
}

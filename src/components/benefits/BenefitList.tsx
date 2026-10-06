import { BenefitCard } from '@/components/benefits/BenefitCard'
import { cn } from '@/lib/utils'
import type { EmployeeBenefit } from '@/types/benefit'

export function BenefitList({ benefits, label, busy }: { benefits: EmployeeBenefit[]; label: string; busy?: boolean }) {
  return (
    <ul aria-label={label} aria-busy={busy} className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', busy && 'opacity-60')}>
      {benefits.map((b) => (
        <li key={b.id}>
          <BenefitCard benefit={b} />
        </li>
      ))}
    </ul>
  )
}

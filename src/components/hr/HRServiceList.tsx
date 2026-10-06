import { HRServiceCard } from '@/components/hr/HRServiceCard'
import { HREmptyState } from '@/components/hr/HRStates'
import type { HRService } from '@/types/hr'

interface HRServiceListProps {
  services: HRService[]
  onClear?: () => void
}

export function HRServiceList({ services, onClear }: HRServiceListProps) {
  if (services.length === 0) {
    return <HREmptyState title="No HR services found." message="Try a different search or category." action={onClear ? { label: 'Clear Filters', onClick: onClear } : undefined} />
  }

  return (
    <ul aria-label="HR services" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <li key={service.id}>
          <HRServiceCard service={service} />
        </li>
      ))}
    </ul>
  )
}

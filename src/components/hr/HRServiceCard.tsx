import { ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { Button } from '@/components/ui/button'
import { unavailableLabels } from '@/lib/services'
import type { HRService } from '@/types/hr'

const typeLabels = { request: 'Online request', form: 'Form', information: 'Information', external: 'External system' } as const

function Action({ service }: { service: HRService }) {
  if (service.status !== 'available') {
    return (
      <Button variant="outline" size="sm" disabled className="bg-white" title={unavailableLabels[service.status]}>
        {unavailableLabels[service.status]}
      </Button>
    )
  }
  if (service.route) {
    return (
      <Button asChild variant="outline" size="sm" className="bg-white text-primary">
        <Link to={service.route} aria-label={`Open ${service.name}`}>
          Open
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    )
  }
  if (service.url?.trim()) {
    return (
      <Button asChild variant="outline" size="sm" className="bg-white text-primary">
        <a href={service.url.trim()} target="_blank" rel="noopener noreferrer">
          Open {service.name}
          <ExternalLink aria-hidden="true" />
        </a>
      </Button>
    )
  }
  return (
    <Button variant="outline" size="sm" disabled className="bg-white">
      Link not configured
    </Button>
  )
}

/** Compact HR service entry: category, name, description, status, one clear action. */
export function HRServiceCard({ service }: { service: HRService }) {
  return (
    <article className="flex h-full flex-col border bg-white p-4">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-gold">{service.category}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="font-serif text-lg font-semibold leading-tight text-primary">{service.name}</h3>
        {service.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
      </div>
      <p className="mt-1 text-[0.8125rem] leading-snug text-muted-foreground">{service.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t pt-3 mt-4">
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80">
            <span aria-hidden="true" className={service.status === 'available' ? 'size-1.5 rounded-full bg-gold' : 'size-1.5 rounded-full bg-muted-foreground/40'} />
            {service.status === 'available' ? 'Available' : unavailableLabels[service.status]}
          </span>
          <span className="text-[0.6875rem] text-muted-foreground">
            {typeLabels[service.type]}
          </span>
        </div>
        <Action service={service} />
      </div>
    </article>
  )
}

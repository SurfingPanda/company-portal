import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { categoryIcons, kindMeta } from '@/components/forms/formMeta'
import { Button } from '@/components/ui/button'
import { getRequestCategoryLabel } from '@/data/requestCategories'
import type { EmployeeRequestType } from '@/types/request'

/** Card for a request type that is submitted online through the portal. */
export function RequestCard({ requestType }: { requestType: EmployeeRequestType }) {
  const available = requestType.status === 'available'
  const CategoryIcon = categoryIcons[requestType.category]
  const Icon = kindMeta.request.icon

  return (
    <article className="flex h-full flex-col border bg-white p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center border bg-primary text-primary-foreground">
          <Icon className="size-[18px]" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-gold">{kindMeta.request.label}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-serif text-lg font-semibold leading-tight text-primary">{requestType.title}</h3>
            {requestType.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
          </div>
          <p className="mt-1 text-[0.8125rem] leading-snug text-muted-foreground">{requestType.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t pt-3">
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground/80">
            <CategoryIcon className="size-3.5" aria-hidden="true" />
            {getRequestCategoryLabel(requestType.category)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80">
            <span aria-hidden="true" className={available ? 'size-1.5 rounded-full bg-gold' : 'size-1.5 rounded-full bg-muted-foreground/40'} />
            {available ? 'Available' : 'Coming Soon'}
          </span>
        </div>
        {available ? (
          <Button asChild variant="outline" size="sm" className="bg-white text-primary">
            <Link to={requestType.route ?? `/forms/${requestType.id}`} aria-label={`Open request: ${requestType.title}`}>
              Open Request
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled className="bg-white">
            Open Request
          </Button>
        )}
      </div>
    </article>
  )
}

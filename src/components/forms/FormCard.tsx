import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { categoryIcons, kindMeta } from '@/components/forms/formMeta'
import { Button } from '@/components/ui/button'
import { getRequestCategoryLabel } from '@/data/requestCategories'
import type { EmployeeForm } from '@/types/form'

/** Card for a form: a downloadable document, or an online form that starts a request. */
export function FormCard({ form }: { form: EmployeeForm }) {
  const meta = kindMeta[form.type]
  const CategoryIcon = categoryIcons[form.category]
  const Icon = meta.icon

  return (
    <article className="flex h-full flex-col border bg-white p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center border ${form.type === 'online' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'}`}
        >
          <Icon className="size-[18px]" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[0.6875rem] font-semibold uppercase tracking-widest ${form.type === 'online' ? 'text-gold' : 'text-muted-foreground'}`}>{meta.label}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-serif text-lg font-semibold leading-tight text-primary">{form.title}</h3>
            {form.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
          </div>
          <p className="mt-1 text-[0.8125rem] leading-snug text-muted-foreground">{form.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground/80">
          <CategoryIcon className="size-3.5" aria-hidden="true" />
          {getRequestCategoryLabel(form.category)}
        </span>
        <Button asChild variant="outline" size="sm" className="bg-white text-primary">
          <Link to={`/forms/${form.id}`} aria-label={`${form.type === 'online' ? 'Open request' : 'View form'}: ${form.title}`}>
            {form.type === 'online' ? 'Open Request' : 'View Form'}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  )
}

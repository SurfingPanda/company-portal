import type { ReactNode } from 'react'
import { Breadcrumbs, type BreadcrumbEntry } from '@/components/layout/Breadcrumbs'

interface PageHeaderProps {
  title: string
  description?: string
  /** Trail after "Home"; omit on the home page. */
  breadcrumbs?: BreadcrumbEntry[]
  /** Optional right-aligned actions. */
  actions?: ReactNode
}

/** Standard header for internal pages: breadcrumbs, title, description and a closing rule. */
export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <header className="border-b-2 border-primary pb-5 pt-8">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
    </header>
  )
}

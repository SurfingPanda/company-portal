import type { ReactNode } from 'react'
import { AppLink } from '@/components/common/AppLink'

interface SectionHeadingProps {
  id: string
  title: string
  number?: string
  description?: string
  action?: ReactNode
}

export function SectionHeading({ id, title, number, description, action }: SectionHeadingProps) {
  return (
    <div className="mb-5 border-t-2 border-primary pt-3">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          {number && <span className="font-mono text-xs font-medium tabular-nums text-gold">{number}</span>}
          <h2 id={id} className="font-serif text-2xl font-semibold tracking-tight text-primary">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

export function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <AppLink
      href={href}
      className="shrink-0 text-xs font-semibold uppercase tracking-wider text-primary underline-offset-4 hover:text-gold hover:underline"
    >
      {children} →
    </AppLink>
  )
}

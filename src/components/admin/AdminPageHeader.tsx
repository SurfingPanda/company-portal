import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AdminPageHeaderProps {
  title: string
  description?: string
  /** Trail shown above the title; the last entry has no link. */
  trail?: { label: string; href?: string }[]
  actions?: ReactNode
}

/** Compact page header used by every administration screen. */
export function AdminPageHeader({ title, description, trail, actions }: AdminPageHeaderProps) {
  return (
    <header className="mb-5 border-b-2 border-primary pb-4">
      {trail && trail.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1.5 text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            {trail.map((entry, index) => (
              <li key={entry.label} className="flex items-center gap-1.5">
                {index > 0 && <span aria-hidden="true">/</span>}
                {entry.href ? (
                  <Link to={entry.href} className="underline-offset-2 hover:underline">
                    {entry.label}
                  </Link>
                ) : (
                  <span aria-current="page">{entry.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-primary">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}

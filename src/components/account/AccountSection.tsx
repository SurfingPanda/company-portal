import type { ReactNode } from 'react'

interface AccountSectionProps {
  id: string
  title: string
  description?: string
  children: ReactNode
}

/** Titled block for settings content that is not a plain list of fields. */
export function AccountSection({ id, title, description, children }: AccountSectionProps) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">
        {title}
      </h2>
      {description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

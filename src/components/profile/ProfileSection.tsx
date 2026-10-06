import type { ReactNode } from 'react'

interface ProfileSectionProps {
  id: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

/** Titled group of fields with a navy rule, in the same style as other portal sections. */
export function ProfileSection({ id, title, description, action, children }: ProfileSectionProps) {
  return (
    <section aria-labelledby={id}>
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-primary pb-2">
        <h2 id={id} className="font-serif text-xl font-semibold text-primary">
          {title}
        </h2>
        {action}
      </div>
      {description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
      <dl>{children}</dl>
    </section>
  )
}

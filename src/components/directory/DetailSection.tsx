import type { ReactNode } from 'react'

interface DetailSectionProps {
  title: string
  items: { label: string; value: ReactNode }[]
}

/** Labelled key/value list shared by the employee profile sections. */
export function DetailSection({ title, items }: DetailSectionProps) {
  return (
    <section aria-label={title}>
      <h2 className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">{title}</h2>
      <dl>
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[8.5rem_1fr] gap-3 border-b border-border py-3 sm:grid-cols-[10rem_1fr]">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</dt>
            <dd className="min-w-0 break-words text-sm text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

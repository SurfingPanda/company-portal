import { CompanySectionHeader } from '@/components/company/CompanySectionHeader'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import type { CompanyValue } from '@/types/company'

export function CoreValues({ values }: { values: CompanyValue[] }) {
  const isDraft = values.some((v) => v.status === 'placeholder')

  return (
    <section aria-labelledby="core-values-heading">
      <CompanySectionHeader
        id="core-values-heading"
        title="Core Values"
        description={isDraft ? 'Draft list pending confirmation by Eljin Corporation management.' : undefined}
      />
      <ol className="grid border-l border-t bg-white sm:grid-cols-2 lg:grid-cols-5">
        {values.map((value, index) => (
          <li key={value.id} className="border-b border-r p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tabular-nums text-gold">{String(index + 1).padStart(2, '0')}</span>
              {value.status === 'placeholder' && <PlaceholderTag />}
            </div>
            <h3 className="mt-2 font-serif text-lg font-semibold leading-tight text-primary">{value.title}</h3>
            {value.description && <p className="mt-1 text-sm text-foreground/75">{value.description}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}

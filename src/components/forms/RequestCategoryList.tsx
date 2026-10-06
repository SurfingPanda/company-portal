import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionHeading } from '@/components/common/SectionHeading'
import { categoryIcons } from '@/components/forms/formMeta'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getCategoryCounts } from '@/services/formService'

/** The four request categories with item counts; each links to the filtered list. */
export function RequestCategoryList() {
  const { data } = useAsync(getCategoryCounts, [])

  return (
    <section aria-labelledby="request-categories-heading">
      <SectionHeading id="request-categories-heading" title="Request Categories" />
      {data ? (
        <ul className="grid border-l border-t bg-white sm:grid-cols-2 xl:grid-cols-4">
          {data.map((category) => {
            const Icon = categoryIcons[category.id]
            return (
              <li key={category.id} className="border-b border-r">
                <Link
                  to={`/forms?category=${category.id}`}
                  className="group flex h-full items-start gap-3 p-4 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <Icon className="mt-0.5 size-[18px] shrink-0 text-primary group-hover:text-gold" strokeWidth={1.5} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-serif text-base font-semibold leading-tight text-primary group-hover:underline">{category.label}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{category.count}</span>
                    </span>
                    <span className="mt-1 block text-[0.8125rem] leading-snug text-muted-foreground">{category.description}</span>
                  </span>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/0 group-hover:text-gold" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-none" />
          ))}
        </div>
      )}
    </section>
  )
}

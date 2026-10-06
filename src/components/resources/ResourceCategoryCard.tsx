import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resourceCategoryIcons } from '@/components/resources/resourceIcons'
import type { ResourceCategory } from '@/types/resource'

/** Category entry: icon, title, short description, resource count (from the index) and link to the owning page or module. */
export function ResourceCategoryCard({ category }: { category: ResourceCategory & { count: number } }) {
  const Icon = resourceCategoryIcons[category.id]

  return (
    <Link
      to={category.href}
      className="group flex h-full items-start gap-3 bg-white p-4 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <Icon className="mt-0.5 size-[18px] shrink-0 text-primary group-hover:text-gold" strokeWidth={1.5} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-serif text-base font-semibold leading-tight text-primary group-hover:underline">{category.title}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {category.count} <span className="sr-only">resources</span>
          </span>
        </span>
        <span className="mt-1 block text-[0.8125rem] leading-snug text-muted-foreground">{category.description}</span>
      </span>
      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/0 group-hover:text-gold" aria-hidden="true" />
    </Link>
  )
}

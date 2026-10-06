import { knowledgeBaseCategories } from '@/data/helpdeskOptions'
import { cn } from '@/lib/utils'
import type { KnowledgeBaseCategory } from '@/types/knowledgeBase'

interface KnowledgeBaseFiltersProps {
  selected?: KnowledgeBaseCategory
  onChange: (category: KnowledgeBaseCategory | undefined) => void
}

/** Category toggle buttons. The selected one is filled and exposed with aria-pressed. */
export function KnowledgeBaseFilters({ selected, onChange }: KnowledgeBaseFiltersProps) {
  const options: { id: KnowledgeBaseCategory | undefined; label: string }[] = [{ id: undefined, label: 'All' }, ...knowledgeBaseCategories]

  return (
    <div role="group" aria-label="Filter articles by category" className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.id === selected
        return (
          <button
            key={o.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={cn(
              'min-h-9 border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              active ? 'border-primary bg-primary text-primary-foreground' : 'bg-white text-foreground hover:bg-accent',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

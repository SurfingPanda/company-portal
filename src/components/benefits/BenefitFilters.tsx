import { cn } from '@/lib/utils'

interface BenefitFiltersProps {
  label: string
  options: { value: string; label: string; count?: number }[]
  selected?: string
  onChange: (value?: string) => void
}

/** Category chips. Only options present in the data are passed in. The selected one is marked with aria-pressed and a check-style weight, not colour alone. */
export function BenefitFilters({ label, options, selected, onChange }: BenefitFiltersProps) {
  const chip = (active: boolean) =>
    cn(
      'border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      active ? 'border-primary bg-primary font-semibold text-primary-foreground' : 'bg-white text-foreground/80 hover:border-primary/50 hover:text-primary',
    )

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={!selected} className={chip(!selected)} onClick={() => onChange(undefined)}>
        All
      </button>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={selected === o.value} className={chip(selected === o.value)} onClick={() => onChange(o.value)}>
          {o.label}
          {o.count !== undefined && <span className="ml-1.5 text-xs opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

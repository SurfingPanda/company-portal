import { useId } from 'react'
import { Switch } from '@/components/ui/switch'

interface PreferenceToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** One on/off preference. The switch is labelled by its title and described by the help text; it saves as soon as it is toggled. */
export function PreferenceToggle({ label, description, checked, onChange }: PreferenceToggleProps) {
  const id = useId()
  const descId = `${id}-desc`

  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-sm font-medium text-foreground">
          {label}
        </label>
        {description && (
          <p id={descId} className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span aria-hidden="true" className="w-6 text-right text-xs font-medium text-muted-foreground">
          {checked ? 'On' : 'Off'}
        </span>
        <Switch id={id} checked={checked} onCheckedChange={onChange} aria-describedby={description ? descId : undefined} />
      </div>
    </div>
  )
}

interface PreferenceChoiceProps<T extends string> {
  legend: string
  description?: string
  value: T
  options: { value: T; label: string; hint?: string }[]
  onChange: (value: T) => void
  name: string
}

/** A small set of mutually exclusive choices (native radio buttons: keyboard and screen-reader friendly). */
export function PreferenceChoice<T extends string>({ legend, description, value, options, onChange, name }: PreferenceChoiceProps<T>) {
  return (
    <fieldset className="border-b border-border py-3">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex cursor-pointer items-center gap-2 border px-3 py-1.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring ${value === o.value ? 'border-primary font-semibold text-primary' : 'bg-white text-foreground/80 hover:border-primary/50'}`}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="size-3.5 accent-[var(--primary)]" />
            {o.label}
            {o.hint && <span className="text-xs font-normal text-muted-foreground">{o.hint}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

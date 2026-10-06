import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { RequestField as Field } from '@/types/request'

interface RequestFieldProps {
  field: Field
  value: string
  error?: string
  onChange: (value: string) => void
}

export const fieldId = (id: string) => `rf-${id}`

/** Renders one configured field. Supports text, textarea, select, date, time, number, email and checkbox. */
export function RequestField({ field, value, error, onChange }: RequestFieldProps) {
  const id = fieldId(field.id)
  const errorId = `${id}-error`
  const helpId = `${id}-help`
  const describedBy = [field.helpText && helpId, error && errorId].filter(Boolean).join(' ') || undefined
  const invalid = Boolean(error)
  const controlClass = cn('bg-white', invalid && 'border-destructive')

  const label = (
    <>
      {field.label}
      {field.required ? (
        <>
          <span aria-hidden="true" className="ml-0.5 text-destructive">*</span>
          <span className="sr-only"> (required)</span>
        </>
      ) : (
        <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
      )}
    </>
  )

  let control
  switch (field.type) {
    case 'textarea':
      control = <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={4} aria-invalid={invalid} aria-describedby={describedBy} className={controlClass} />
      break
    case 'select':
      control = (
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger id={id} aria-invalid={invalid} aria-describedby={describedBy} className={cn('w-full', controlClass)}>
            <SelectValue placeholder={field.placeholder ?? 'Select an option'} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
      break
    case 'checkbox':
      return (
        <div>
          <div className="flex items-start gap-2.5">
            <Checkbox id={id} checked={value === 'true'} onCheckedChange={(checked) => onChange(checked === true ? 'true' : '')} aria-invalid={invalid} aria-describedby={describedBy} className="mt-0.5" />
            <label htmlFor={id} className="text-sm leading-snug text-foreground">
              {label}
            </label>
          </div>
          {field.helpText && (
            <p id={helpId} className="mt-1 pl-6 text-xs text-muted-foreground">
              {field.helpText}
            </p>
          )}
          {error && (
            <p id={errorId} className="mt-1 pl-6 text-sm font-medium text-destructive">
              <span aria-hidden="true">⚠ </span>
              {error}
            </p>
          )}
        </div>
      )
    default:
      control = (
        <Input
          id={id}
          type={field.type === 'email' ? 'email' : field.type}
          value={value}
          min={field.type === 'number' ? field.min : undefined}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn('h-10', controlClass)}
        />
      )
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {control}
      {field.helpText && (
        <p id={helpId} className="mt-1 text-xs text-muted-foreground">
          {field.helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm font-medium text-destructive">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  )
}

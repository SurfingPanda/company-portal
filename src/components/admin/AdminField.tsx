import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export type FieldKind = 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'datetime' | 'date' | 'email' | 'json'

export interface FieldDef {
  name: string
  label: string
  kind: FieldKind
  required?: boolean
  help?: string
  options?: { value: string; label: string }[]
  /** Not editable after creation (e.g. the employee ID or a request code). */
  createOnly?: boolean
  maxLength?: number
  rows?: number
  /** Heading of the card this field belongs to (fields with the same section sit together). */
  section?: string
  /** Spans both columns (long text); text areas and JSON always do. */
  wide?: boolean
  /** Only shown while another field has one of these values (e.g. a portal path only for portal destinations). */
  showWhen?: { field: string; values: string[] }
}

interface AdminFieldProps {
  def: FieldDef
  value: string | boolean
  error?: string
  disabled?: boolean
  onChange: (value: string | boolean) => void
}

/** One labelled form control with help text and an accessible error message. */
export function AdminField({ def, value, error, disabled, onChange }: AdminFieldProps) {
  const id = `field-${def.name}`
  const describedBy = [def.help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  const common = { id, disabled, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy }
  const border = error ? 'border-destructive' : ''

  let control: ReactNode
  switch (def.kind) {
    case 'textarea':
    case 'json':
      control = <Textarea {...common} rows={def.rows ?? (def.kind === 'json' ? 10 : 4)} value={String(value)} maxLength={def.maxLength} onChange={(e) => onChange(e.target.value)} className={cn('bg-white', def.kind === 'json' && 'font-mono text-xs', border)} />
      break
    case 'select':
      control = (
        <select {...common} value={String(value)} onChange={(e) => onChange(e.target.value)} className={cn('h-10 w-full border border-input bg-white px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring', border)}>
          {!def.required && <option value="">None</option>}
          {(def.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
      break
    case 'checkbox':
      return (
        <div className="h-full border bg-muted/30 p-3">
          <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
            <input {...common} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-primary" />
            {def.label}
          </label>
          {def.help && (
            <p id={`${id}-help`} className="mt-1 text-xs text-muted-foreground">
              {def.help}
            </p>
          )}
          {error && (
            <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-destructive">
              <span aria-hidden="true">⚠ </span>
              {error}
            </p>
          )}
        </div>
      )
    default:
      control = <Input {...common} type={def.kind === 'datetime' ? 'datetime-local' : def.kind === 'date' ? 'date' : def.kind === 'number' ? 'number' : def.kind === 'email' ? 'email' : 'text'} value={String(value)} maxLength={def.maxLength} onChange={(e) => onChange(e.target.value)} className={cn('h-10 bg-white', border)} />
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {def.label}
        {def.required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-destructive">*</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {control}
      {def.help && (
        <p id={`${id}-help`} className="mt-1 text-xs text-muted-foreground">
          {def.help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-destructive">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  )
}

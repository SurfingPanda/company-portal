import type { ReactNode } from 'react'
import { Lock, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileFieldProps {
  label: string
  value?: ReactNode
  /** HR-managed information that employees cannot edit here. Shown with a "Read-only" label. */
  readOnly?: boolean
  /** Employee self-service information. Shown with an "Editable" label so state never relies on colour. */
  editable?: boolean
  /** Small explanatory line under the value. */
  helper?: string
  mono?: boolean
}

/** Label/value row for employee information. Missing values read "Not provided" (not an error). Not a disabled input. */
export function ProfileField({ label, value, readOnly = false, editable = false, helper, mono = false }: ProfileFieldProps) {
  const empty = value === undefined || value === null || value === ''

  return (
    <div className="grid gap-0.5 border-b border-border py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className={cn('min-w-0 break-words', mono && 'font-mono', empty && 'italic text-muted-foreground')}>{empty ? 'Not provided' : value}</span>
          {readOnly && (
            <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
              <Lock className="size-3" aria-hidden="true" />
              Read-only
            </span>
          )}
          {editable && (
            <span className="inline-flex items-center gap-1 text-[0.6875rem] text-primary">
              <Pencil className="size-3" aria-hidden="true" />
              Editable
            </span>
          )}
        </div>
        {helper && <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>}
      </dd>
    </div>
  )
}

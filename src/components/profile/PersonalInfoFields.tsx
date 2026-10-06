import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { emptyContact } from '@/lib/personalInfo'
import { civilStatusLabels, MAX_EMERGENCY_CONTACTS, type CivilStatus, type EmergencyContact, type PersonalInfo } from '@/types/personalInfo'

export type PersonalErrors = Record<string, string>

const label = 'mb-1.5 block text-sm font-medium'
const optional = <span className="font-normal text-muted-foreground"> (optional)</span>

interface DetailsProps {
  value: PersonalInfo
  onChange: (next: PersonalInfo) => void
  errors: PersonalErrors
  disabled?: boolean
  idPrefix?: string
}

/** Date of birth, civil status and home address. Everything is optional. */
export function PersonalDetailsFields({ value, onChange, errors, disabled, idPrefix = 'pd' }: DetailsProps) {
  const set = <K extends keyof PersonalInfo>(key: K, v: PersonalInfo[K]) => onChange({ ...value, [key]: v })
  const text = (key: 'address_line' | 'city' | 'province' | 'postal_code', title: string, max: number) => (
    <div>
      <label htmlFor={`${idPrefix}-${key}`} className={label}>{title}{optional}</label>
      <Input id={`${idPrefix}-${key}`} value={value[key] ?? ''} maxLength={max} disabled={disabled} aria-invalid={Boolean(errors[key])} onChange={(e) => set(key, e.target.value || null)} className="h-10 bg-white" />
      {errors[key] && <p className="mt-1 text-sm text-destructive">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={`${idPrefix}-dob`} className={label}>Date of birth{optional}</label>
        <Input id={`${idPrefix}-dob`} type="date" value={value.date_of_birth ?? ''} disabled={disabled} aria-invalid={Boolean(errors.date_of_birth)} onChange={(e) => set('date_of_birth', e.target.value || null)} className="h-10 bg-white" />
        {errors.date_of_birth && <p className="mt-1 text-sm text-destructive">{errors.date_of_birth}</p>}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-civil`} className={label}>Civil status{optional}</label>
        <select id={`${idPrefix}-civil`} value={value.civil_status ?? ''} disabled={disabled} onChange={(e) => set('civil_status', (e.target.value || null) as CivilStatus | null)} className="h-10 w-full border border-input bg-white px-2 text-sm">
          <option value="">Prefer not to say</option>
          {Object.entries(civilStatusLabels).map(([v, text]) => <option key={v} value={v}>{text}</option>)}
        </select>
        {errors.civil_status && <p className="mt-1 text-sm text-destructive">{errors.civil_status}</p>}
      </div>
      <div className="space-y-2 sm:col-span-2">
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={value.share_birthday && value.date_of_birth !== null} disabled={disabled || value.date_of_birth === null} onCheckedChange={(c) => set('share_birthday', c === true)} className="mt-0.5" />
          <span>
            Let my colleagues see my birthday on the dashboard
            <span className="block text-xs text-muted-foreground">Only the day and month are shown, never the year or your age. {value.date_of_birth === null ? 'Add your date of birth first.' : 'You can change this any time.'}</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={value.share_anniversary} disabled={disabled} onCheckedChange={(c) => set('share_anniversary', c === true)} className="mt-0.5" />
          <span>
            Let my colleagues see my work anniversary
            <span className="block text-xs text-muted-foreground">Based on the date you joined, as HR recorded it.</span>
          </span>
        </label>
      </div>
      <div className="sm:col-span-2">{text('address_line', 'Home address', 255)}</div>
      {text('city', 'City / municipality', 100)}
      {text('province', 'Province', 100)}
      {text('postal_code', 'Postal code', 20)}
    </div>
  )
}

interface ContactsProps {
  contacts: EmergencyContact[]
  onChange: (next: EmergencyContact[]) => void
  errors: PersonalErrors
  disabled?: boolean
  idPrefix?: string
}

/** Up to five people to call in an emergency; the first one is called first. Name, relationship and phone are required. */
export function EmergencyContactsEditor({ contacts, onChange, errors, disabled, idPrefix = 'ec' }: ContactsProps) {
  const rows = contacts.length > 0 ? contacts : [emptyContact()]
  const update = (i: number, patch: Partial<EmergencyContact>) => onChange(rows.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  const err = (i: number, field: string) => errors[`emergency_contacts.${i}.${field}`]

  const input = (i: number, field: 'name' | 'relationship' | 'phone' | 'alternate_phone' | 'email', title: string, opts: { required?: boolean; type?: string; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={`${idPrefix}-${i}-${field}`} className={label}>{title}{!opts.required && optional}</label>
      <Input
        id={`${idPrefix}-${i}-${field}`}
        type={opts.type ?? 'text'}
        value={rows[i][field] ?? ''}
        placeholder={opts.placeholder}
        disabled={disabled}
        aria-invalid={Boolean(err(i, field))}
        onChange={(e) => update(i, { [field]: opts.required ? e.target.value : e.target.value || null } as Partial<EmergencyContact>)}
        className="h-10 bg-white"
      />
      {err(i, field) && <p className="mt-1 text-sm text-destructive">{err(i, field)}</p>}
    </div>
  )

  return (
    <div className="space-y-4">
      <ol className="space-y-4">
        {rows.map((_, i) => (
          <li key={i} className="border bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-primary">{i === 0 ? 'Call first' : `Contact ${i + 1}`}</h3>
              {rows.length > 1 && (
                <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label={`Remove contact ${i + 1}`}>
                  <Trash2 aria-hidden="true" /> Remove
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {input(i, 'name', 'Full name', { required: true })}
              {input(i, 'relationship', 'Relationship', { required: true, placeholder: 'e.g. Spouse, Parent, Sibling' })}
              {input(i, 'phone', 'Phone number', { required: true, type: 'tel', placeholder: '0917 123 4567' })}
              {input(i, 'alternate_phone', 'Another phone number', { type: 'tel' })}
              <div className="sm:col-span-2">{input(i, 'email', 'Email', { type: 'email' })}</div>
            </div>
          </li>
        ))}
      </ol>
      {rows.length < MAX_EMERGENCY_CONTACTS && (
        <Button type="button" variant="outline" className="bg-white" disabled={disabled} onClick={() => onChange([...rows, emptyContact()])}>
          <Plus aria-hidden="true" /> Add another contact
        </Button>
      )}
      {errors.emergency_contacts && <p role="alert" className="text-sm font-medium text-destructive">{errors.emergency_contacts}</p>}
    </div>
  )
}

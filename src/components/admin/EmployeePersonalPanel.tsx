import { useState } from 'react'
import { useMutation } from '@/hooks/useMutation'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { getEmployeePersonalInfo } from '@/services/personalInfoService'
import { civilStatusLabels, type PersonalInfo } from '@/types/personalInfo'

const Row = ({ k, v }: { k: string; v?: string | null }) => (
  <div className="grid grid-cols-[10rem_1fr] gap-3 border-b py-2 text-sm">
    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt>
    <dd className={v ? '' : 'italic text-muted-foreground'}>{v || 'Not provided'}</dd>
  </div>
)

/**
 * HR: the employee's own personal details and emergency contacts. Loaded only when asked for, because every look is written to the
 * audit log. Shows nothing for an employee who has no portal account yet.
 */
export function EmployeePersonalPanel({ entryId, hasAccount, name }: { entryId: number; hasAccount: boolean; name: string }) {
  const [info, setInfo] = useState<PersonalInfo | null | undefined>(undefined)
  const load = useMutation(() => getEmployeePersonalInfo(entryId))

  const show = async () => {
    const result = await load.mutate(undefined)
    if (result !== undefined) setInfo(result)
  }
  const address = info ? [info.address_line, info.city, info.province, info.postal_code].filter(Boolean).join(', ') : ''

  return (
    <section aria-labelledby="personal-h">
      <h2 id="personal-h" className="border-b-2 border-primary pb-2 font-serif text-lg font-semibold text-primary">Personal details and emergency contacts</h2>
      {!hasAccount ? (
        <p className="mt-3 text-sm text-muted-foreground">{name} has no login yet, so has not entered these. Employees fill them in themselves the first time they sign in.</p>
      ) : info === undefined ? (
        <>
          <p className="mt-3 text-sm text-muted-foreground">Entered by the employee. Opening this is recorded in the audit log.</p>
          <Button type="button" variant="outline" className="mt-3 bg-white" disabled={load.submitting} onClick={() => void show()}>{load.submitting ? 'Opening…' : 'Show personal details'}</Button>
          {load.error && <p role="alert" className="mt-2 text-sm text-destructive">{load.error}</p>}
        </>
      ) : info === null ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing to show.</p>
      ) : (
        <>
          <dl className="mt-2">
            <Row k="Date of birth" v={info.date_of_birth ? formatDate(info.date_of_birth, 'long') : null} />
            <Row k="Civil status" v={info.civil_status ? civilStatusLabels[info.civil_status] : null} />
            <Row k="Home address" v={address} />
          </dl>
          <h3 className="mt-5 text-sm font-semibold text-primary">Emergency contacts</h3>
          {info.emergency_contacts.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">None added yet.</p>
          ) : (
            <ol className="mt-2 space-y-2">
              {info.emergency_contacts.map((c, i) => (
                <li key={`${c.name}-${i}`} className="border bg-white p-3 text-sm">
                  <p className="font-medium">{i === 0 ? 'Call first: ' : ''}{c.name} <span className="font-normal text-muted-foreground">· {c.relationship}</span></p>
                  <p className="mt-0.5">{c.phone}{c.alternate_phone ? ` · ${c.alternate_phone}` : ''}{c.email ? ` · ${c.email}` : ''}</p>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Employees change these themselves under My Profile. HR cannot edit them.</p>
        </>
      )}
    </section>
  )
}

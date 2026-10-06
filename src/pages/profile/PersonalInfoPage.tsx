import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmergencyContactsEditor, PersonalDetailsFields, type PersonalErrors } from '@/components/profile/PersonalInfoFields'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getApiErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import { cleanContacts, isCompleteContact } from '@/lib/personalInfo'
import { getPersonalInfo, savePersonalInfo } from '@/services/personalInfoService'
import type { PersonalInfo } from '@/types/personalInfo'

function Form({ initial }: { initial: PersonalInfo }) {
  const [value, setValue] = useState<PersonalInfo>(initial)
  const [errors, setErrors] = useState<PersonalErrors>({})
  const [message, setMessage] = useState<string>()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setSaved(false)
    setMessage(undefined)
    const contacts = cleanContacts(value.emergency_contacts)
    const incomplete = contacts.findIndex((c) => !isCompleteContact(c))
    if (incomplete >= 0) {
      setErrors({ [`emergency_contacts.${incomplete}.name`]: 'Name, relationship and phone are all needed for an emergency contact.' })
      return
    }
    setErrors({})
    setBusy(true)
    try {
      const result = await savePersonalInfo({ ...value, emergency_contacts: contacts })
      setValue(result)
      setSaved(true)
    } catch (e) {
      const fields = getFieldErrors(e)
      setErrors(fields)
      if (Object.keys(fields).length === 0) setMessage(getApiErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save() }} noValidate className="max-w-3xl space-y-10">
      {saved && <p role="status" className="flex items-center gap-2 border border-gold/40 bg-white px-4 py-3 text-sm font-medium text-primary"><CircleCheck className="size-4 text-gold" aria-hidden="true" /> Saved.</p>}
      {message && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{message}</p>}
      {Object.keys(errors).length > 0 && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">Please fix the highlighted fields.</p>}

      <section aria-labelledby="pi-details">
        <h2 id="pi-details" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">Personal details</h2>
        <p className="mb-4 mt-2 text-xs text-muted-foreground">Only you and HR can see these. They are never shown in the Employee Directory.</p>
        <PersonalDetailsFields value={value} onChange={setValue} errors={errors} disabled={busy} />
      </section>

      <section aria-labelledby="pi-contacts">
        <h2 id="pi-contacts" className="border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary">Emergency contacts</h2>
        <p className="mb-4 mt-2 text-xs text-muted-foreground">Who should HR call if something happens to you? List the person to call first at the top. Only you and HR can see them.</p>
        <EmergencyContactsEditor contacts={value.emergency_contacts} onChange={(emergency_contacts) => setValue({ ...value, emergency_contacts })} errors={errors} disabled={busy} />
      </section>

      <div className="flex gap-3 border-t pt-4">
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
        <Button asChild variant="outline" className="bg-white"><Link to="/profile">Back to my profile</Link></Button>
      </div>
    </form>
  )
}

/** The employee's own personal details and emergency contacts. */
export default function PersonalInfoPage() {
  const { data, error, retry } = useAsync(getPersonalInfo, [])

  return (
    <PageContainer className="pb-16">
      <PageHeader title="Personal Information" description="Your personal details and the people to call in an emergency." breadcrumbs={[{ label: 'My Profile', href: '/profile' }, { label: 'Personal Information' }]} />
      <div className="mt-6">
        {error ? (
          <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive">Unable to load your information.</p>
            <Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button>
          </div>
        ) : !data ? (
          <Skeleton className="h-96 max-w-3xl" />
        ) : (
          <Form initial={data} />
        )}
      </div>
    </PageContainer>
  )
}

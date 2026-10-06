import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminField } from '@/components/admin/AdminField'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { useMutation } from '@/hooks/useMutation'
import { getUser, updateUserEmail } from '@/services/admin/adminApi'

/** Edit a portal account. Only the portal email is editable: the employee ID is the immutable link, and every HR fact is edited in HR Management. */
export default function UserEditPage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, retry } = useAsync(() => getUser(userId), [userId])
  const [email, setEmail] = useState('')
  useEffect(() => { if (data) setEmail(data.email) }, [data])
  const save = useMutation((value: string) => updateUserEmail(Number(userId), value))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (await save.mutate(email)) navigate(`/admin/users/${userId}`)
  }

  return (
    <>
      <AdminPageHeader title="Edit user" trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Users', href: '/admin/users' }, { label: data?.employee_id ?? '…', href: `/admin/users/${userId}` }, { label: 'Edit' }]} />
      {error ? (
        <div role="alert" className="max-w-xl border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-semibold text-destructive">Unable to load this user.</p><Button type="button" variant="outline" size="sm" className="mt-2 bg-white" onClick={retry}>Try again</Button></div>
      ) : loading || !data ? (
        <Skeleton className="h-48 max-w-xl" />
      ) : (
        <form onSubmit={submit} noValidate aria-label="Edit user" className="max-w-xl space-y-5 border bg-white p-5 sm:p-6">
          <AdminField def={{ name: 'employee_id', label: 'Employee ID', kind: 'text', help: 'Links the account to the employee record. It cannot be changed.' }} value={data.employee_id} disabled onChange={() => undefined} />
          {save.error && !save.fieldErrors.email && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{save.error}</p>}
          <AdminField def={{ name: 'email', label: 'Company email', kind: 'email', required: true, maxLength: 255 }} value={email} error={save.fieldErrors.email} disabled={save.submitting} onChange={(v) => setEmail(String(v))} />
          <p className="text-xs text-muted-foreground">Status and roles are managed on the user page, where each change is confirmed and recorded.</p>
          <div className="flex gap-3 border-t pt-4">
            <Button type="submit" disabled={save.submitting}>{save.submitting ? 'Saving…' : 'Save changes'}</Button>
            <Button asChild variant="outline" className="bg-white"><Link to={`/admin/users/${userId}`}>Cancel</Link></Button>
          </div>
        </form>
      )}
    </>
  )
}

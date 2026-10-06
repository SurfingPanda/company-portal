import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminField, type FieldDef } from '@/components/admin/AdminField'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { useMutation } from '@/hooks/useMutation'
import { createUser } from '@/services/admin/adminApi'
import type { AccountStatus } from '@/types/admin'
import { roleChoices } from '@/auth/roles'
import { roleOptions, statusOptions } from '@/pages/admin/users/UsersListPage'

const fields: FieldDef[] = [
  { name: 'employee_id', label: 'Employee ID', kind: 'text', required: true, maxLength: 32, help: 'The link to the employee record kept by HR. It cannot be changed after the account is created.' },
  { name: 'email', label: 'Company email', kind: 'email', required: true, maxLength: 255 },
  { name: 'role', label: 'Role', kind: 'select', required: true, options: roleOptions, help: 'What this person can do in the portal. Roles can be added or removed later on the user page.' },
  { name: 'status', label: 'Account status', kind: 'select', required: true, options: statusOptions, help: 'Pending (recommended): the person gets an email to choose their password, which activates the account. Active: can sign in once a password is set (use Send password reset email). Inactive: no access. Suspended: temporarily blocked.' },
]

/**
 * Create a portal account. Only the employee ID, company email, role and status are asked for. No password is entered here
 * (the backend creates an unusable one until an activation step exists) and no HR data (salary, government IDs, leave…)
 * is requested or stored.
 */
export default function UserCreatePage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<Record<string, string>>({ employee_id: '', email: '', role: 'employee', status: 'pending' })
  const save = useMutation((body: typeof values) => createUser({ employee_id: body.employee_id.trim(), email: body.email.trim(), role: body.role, status: body.status as AccountStatus }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const created = await save.mutate(values)
    if (created) navigate(`/admin/users/${created.id}`, { state: { created: true } })
  }

  return (
    <>
      <AdminPageHeader title="Create user" trail={[{ label: 'Administration', href: '/admin/dashboard' }, { label: 'Users', href: '/admin/users' }, { label: 'Create' }]} />
      <form onSubmit={submit} noValidate aria-label="Create user" className="max-w-xl space-y-5 border bg-white p-5 sm:p-6">
        <p className="border border-dashed border-muted-foreground/40 p-3 text-xs text-muted-foreground">
          Only portal account data is entered here. Do not enter salary, payroll, government ID, bank, medical, attendance or leave information: those are not stored in the portal.
        </p>
        {save.error && Object.keys(save.fieldErrors).length === 0 && <p role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{save.error}</p>}
        {fields.map((f) => (
          <div key={f.name}>
            <AdminField def={f} value={values[f.name]} error={save.fieldErrors[f.name]} disabled={save.submitting} onChange={(v) => setValues((prev) => ({ ...prev, [f.name]: String(v) }))} />
            {f.name === 'role' && (
              <p role="note" className="mt-2 border-l-2 border-primary/40 pl-3 text-xs text-muted-foreground">
                <strong className="text-foreground">{roleChoices.find((r) => r.value === values.role)?.label}:</strong> {roleChoices.find((r) => r.value === values.role)?.description}
              </p>
            )}
          </div>
        ))}
        <div className="flex gap-3 border-t pt-4">
          <Button type="submit" disabled={save.submitting}>{save.submitting ? 'Creating…' : 'Create user'}</Button>
          <Button asChild variant="outline" className="bg-white"><Link to="/admin/users">Cancel</Link></Button>
        </div>
      </form>
    </>
  )
}

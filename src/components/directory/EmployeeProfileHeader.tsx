import { useEffect, useState } from 'react'
import { Check, Copy, Mail, Phone } from 'lucide-react'
import { EmployeeAvatar } from '@/components/common/EmployeeAvatar'
import { StatusBadge } from '@/components/directory/StatusBadge'
import { Button } from '@/components/ui/button'
import { getFullName } from '@/lib/employee'
import type { Employee } from '@/types/employee'

export function EmployeeProfileHeader({ employee }: { employee: Employee }) {
  const [copied, setCopied] = useState(false)
  const fullName = getFullName(employee)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(employee.email)
      setCopied(true)
    } catch {
      // Clipboard access can be blocked; the email is still shown and linked on the page.
    }
  }

  return (
    <section aria-labelledby="employee-name" className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <EmployeeAvatar name={fullName} imageUrl={employee.avatarUrl} className="size-20 text-xl [&_span]:text-xl" />
        <div className="min-w-0 flex-1">
          <h1 id="employee-name" className="font-serif text-3xl font-semibold tracking-tight text-primary">
            {fullName}
          </h1>
          <p className="mt-1 text-base text-foreground">{employee.position}</p>
          <p className="text-sm text-muted-foreground">{employee.department} Department</p>
          {employee.status === 'on-leave' && <StatusBadge status={employee.status} className="mt-2" />}
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button asChild>
            <a href={`mailto:${employee.email}`}>
              <Mail aria-hidden="true" /> Send Email
            </a>
          </Button>
          <Button variant="outline" className="bg-white" onClick={copyEmail}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy Email'}
          </Button>
          {employee.phone && (
            <Button asChild variant="outline" className="bg-white">
              <a href={`tel:${employee.phone.replace(/\s/g, '')}`}>
                <Phone aria-hidden="true" /> Call
              </a>
            </Button>
          )}
        </div>
      </div>
      <p className="sr-only" role="status">
        {copied ? 'Email address copied to clipboard' : ''}
      </p>
    </section>
  )
}

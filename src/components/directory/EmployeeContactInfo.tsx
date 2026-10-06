import { DetailSection } from '@/components/directory/DetailSection'
import type { Employee } from '@/types/employee'

export function EmployeeContactInfo({ employee }: { employee: Employee }) {
  return (
    <DetailSection
      title="Contact Information"
      items={[
        {
          label: 'Email',
          value: (
            <a href={`mailto:${employee.email}`} className="text-primary hover:underline">
              {employee.email}
            </a>
          ),
        },
        {
          label: 'Phone',
          value: employee.phone ? (
            <a href={`tel:${employee.phone.replace(/\s/g, '')}`} className="text-primary hover:underline">
              {employee.phone}
            </a>
          ) : (
            <span className="text-muted-foreground">Not listed</span>
          ),
        },
        { label: 'Office Location', value: employee.location },
      ]}
    />
  )
}

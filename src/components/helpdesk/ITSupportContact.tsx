import { LifeBuoy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getSupportContact } from '@/services/helpdeskService'

/** "Need Help?" block. Every detail comes from configuration; unset values show the MIS placeholder. */
export function ITSupportContact() {
  const { data } = useAsync(getSupportContact, [])

  const rows = data
    ? [
        { label: 'Support Hours', value: data.supportHours },
        { label: 'Email', value: data.email },
        { label: 'Phone', value: data.phone },
        { label: 'Office Location', value: data.officeLocation },
      ]
    : []

  return (
    <section aria-labelledby="need-help-heading" className="border border-l-4 border-l-primary bg-white p-5">
      <div className="flex items-start gap-3">
        <LifeBuoy className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="need-help-heading" className="font-serif text-lg font-semibold text-primary">
            Need Help?
          </h2>
          {!data ? (
            <Skeleton className="mt-2 h-16 rounded-sm" />
          ) : (
            <>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{data.name}</p>
              <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {rows.map((row) => (
                  <div key={row.label}>
                    <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">{row.label}</dt>
                    <dd className={row.value ? 'text-sm' : 'text-xs italic text-muted-foreground'}>{row.value ?? data.placeholder}</dd>
                  </div>
                ))}
              </dl>
              <Button asChild size="sm" className="mt-4">
                <Link to="/helpdesk/new">Submit an IT Support Request</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

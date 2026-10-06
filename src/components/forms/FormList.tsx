import { FormCard } from '@/components/forms/FormCard'
import { RequestCard } from '@/components/forms/RequestCard'
import type { CatalogItem } from '@/types/form'

const gridClass = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'

function Cards({ items, label }: { items: CatalogItem[]; label: string }) {
  return (
    <ul aria-label={label} className={gridClass}>
      {items.map((item) => (
        <li key={item.kind === 'form' ? item.form.id : item.requestType.id}>
          {item.kind === 'form' ? <FormCard form={item.form} /> : <RequestCard requestType={item.requestType} />}
        </li>
      ))}
    </ul>
  )
}

/**
 * Renders catalog items. When both online requests and forms are present they are shown in two
 * labelled groups, so the difference between a request and a form is always clear.
 */
export function FormList({ items, grouped = true }: { items: CatalogItem[]; grouped?: boolean }) {
  const requests = items.filter((i) => i.kind === 'request' || i.form.type === 'online')
  const downloads = items.filter((i) => i.kind === 'form' && i.form.type === 'download')

  if (!grouped || requests.length === 0 || downloads.length === 0) {
    return <Cards items={items} label="Forms and requests" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Online Requests ({requests.length})</h3>
        <Cards items={requests} label="Online requests" />
      </div>
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Downloadable Forms ({downloads.length})</h3>
        <Cards items={downloads} label="Downloadable forms" />
      </div>
    </div>
  )
}

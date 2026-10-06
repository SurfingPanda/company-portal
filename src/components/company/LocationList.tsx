import { useId, useState } from 'react'
import { ChevronDown, MapPin } from 'lucide-react'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { PENDING_TEXT } from '@/data/companyData'
import { cn } from '@/lib/utils'
import type { Location } from '@/types/company'

interface LocationListProps {
  locations: Location[]
  /** Hide the expandable details (used in the overview). */
  compact?: boolean
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm', !value || value.startsWith('[') || value.includes('to be provided') ? 'italic text-muted-foreground' : 'text-foreground')}>
        {value ?? PENDING_TEXT}
      </dd>
    </div>
  )
}

function LocationItem({ location, compact }: { location: Location; compact: boolean }) {
  const [open, setOpen] = useState(false)
  const detailsId = useId()

  return (
    <li className="border-b border-border p-5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <MapPin className="size-4 text-gold" aria-hidden="true" />
        <h3 className="font-serif text-xl font-semibold text-primary">{location.name}</h3>
        {location.status === 'placeholder' && <PlaceholderTag />}
      </div>
      <dl className="mt-3 space-y-1.5">
        <Field label="Address" value={location.address} />
        {(location.phone || !compact) && <Field label="Contact" value={location.phone} />}
      </dl>
      {!compact && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={detailsId}
            className="mt-4 inline-flex items-center gap-1 border bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {open ? 'Hide Details' : 'View Details'}
            <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
          </button>
          <div id={detailsId} hidden={!open} className="mt-4 space-y-4 border-t pt-4">
            <dl className="space-y-1.5">
              <Field label="Email" value={location.email} />
              <Field label="Business Hours" value={location.businessHours} />
            </dl>
            {/* Reserved for a future map embed (e.g. Google Maps) once official addresses exist. */}
            <div
              data-slot="map-placeholder"
              className="flex h-24 items-center justify-center border border-dashed text-xs text-muted-foreground"
            >
              Map will be available once the official address is provided.
            </div>
          </div>
        </>
      )}
    </li>
  )
}

export function LocationList({ locations, compact = false }: LocationListProps) {
  return (
    <ul className="border bg-white">
      {locations.map((location) => (
        <LocationItem key={location.id} location={location} compact={compact} />
      ))}
    </ul>
  )
}

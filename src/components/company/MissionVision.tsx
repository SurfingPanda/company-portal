import { CompanySectionHeader } from '@/components/company/CompanySectionHeader'
import { PlaceholderTag, StatusText } from '@/components/company/ContentStatus'
import type { CompanyProfile, CompanyStatement } from '@/types/company'

function Statement({ id, label, statement }: { id: string; label: string; statement: CompanyStatement }) {
  return (
    <section aria-labelledby={id} className="border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 id={id} className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          {label}
        </h3>
        {statement.status === 'placeholder' && <PlaceholderTag />}
      </div>
      <StatusText text={statement.text} status={statement.status} className="mt-3 font-serif text-lg leading-relaxed" />
    </section>
  )
}

export function MissionVision({ profile }: { profile: CompanyProfile }) {
  return (
    <section aria-labelledby="mission-vision-heading">
      <CompanySectionHeader id="mission-vision-heading" title="Mission & Vision" />
      <div className="grid gap-4 md:grid-cols-2">
        <Statement id="mission-heading" label="Mission" statement={profile.mission} />
        <Statement id="vision-heading" label="Vision" statement={profile.vision} />
      </div>
    </section>
  )
}

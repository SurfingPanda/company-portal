import { PlaceholderTag, StatusText } from '@/components/company/ContentStatus'
import type { CompanyProfile } from '@/types/company'

export function CompanyIntro({ profile }: { profile: CompanyProfile }) {
  return (
    <section aria-labelledby="company-intro-heading">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="company-intro-heading" className="font-serif text-2xl font-semibold text-primary">
          {profile.introductionTitle}
        </h2>
        {profile.introduction.status === 'placeholder' && <PlaceholderTag />}
      </div>
      <StatusText
        text={profile.introduction.text}
        status={profile.introduction.status}
        className="mt-3 max-w-2xl text-base leading-relaxed"
      />
    </section>
  )
}

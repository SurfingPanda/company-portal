import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlaceholderTag } from '@/components/company/ContentStatus'
import { BenefitStatus } from '@/components/benefits/BenefitStatus'
import { SampleHRNotice } from '@/components/hr/HRStates'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/hooks/useAsync'
import { getDocument } from '@/services/documentService'
import { getFormDetail } from '@/services/formService'
import { getBenefitCategoryLabel } from '@/services/benefitService'
import { getHRService } from '@/services/hrService'
import type { EmployeeBenefit } from '@/types/benefit'

const headingClass = 'border-b-2 border-primary pb-2 font-serif text-xl font-semibold text-primary'
const linkClass = 'text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring'

/** Related items are looked up by id in the Documents, Forms and HR Services modules; their metadata is not copied here. */
function RelatedResources({ benefit }: { benefit: EmployeeBenefit }) {
  const { data } = useAsync(async () => {
    const [documents, forms, services] = await Promise.all([
      Promise.all((benefit.relatedDocumentIds ?? []).map((id) => getDocument(id))),
      Promise.all((benefit.relatedFormIds ?? []).map((id) => getFormDetail(id))),
      Promise.all((benefit.relatedServiceIds ?? []).map((id) => getHRService(id))),
    ])
    return {
      documents: documents.filter((d): d is NonNullable<typeof d> => Boolean(d)),
      forms: forms.filter((f): f is NonNullable<typeof f> => Boolean(f)),
      services: services.filter((s): s is NonNullable<typeof s> => Boolean(s)),
    }
  }, [benefit.id])

  const group = (title: string, items: { key: string; label: string; to?: string }[]) =>
    items.length > 0 && (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <ul className="mt-2 space-y-1.5">
          {items.map((i) => (
            <li key={i.key}>{i.to ? <Link to={i.to} className={linkClass}>{i.label}</Link> : <span className="text-sm">{i.label}</span>}</li>
          ))}
        </ul>
      </div>
    )

  return (
    <section aria-labelledby="benefit-related-heading">
      <h2 id="benefit-related-heading" className={headingClass}>
        Related Resources
      </h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {data ? (
          <>
            {group('Documents', data.documents.map((d) => ({ key: d.id, label: d.title, to: `/documents/${d.id}` })))}
            {group('Forms', data.forms.map((f) => ({ key: f.form?.id ?? f.requestType?.id ?? '', label: f.form?.title ?? f.requestType?.title ?? '', to: `/forms/${f.form?.id ?? f.requestType?.id}` })))}
            {group('HR Services', data.services.map((s) => ({ key: s.id, label: s.name, to: s.route })))}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading related resources…</p>
        )}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">FAQ</h3>
          <p className="mt-2">
            <Link to="/benefits/faq" className={linkClass}>
              Benefits FAQ
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

/** Benefit detail. Eligibility and coverage show "not yet published" until HR supplies them; nothing is invented. */
export function BenefitDetail({ benefit }: { benefit: EmployeeBenefit }) {
  return (
    <div className="space-y-8">
      <header className="border border-t-2 border-border border-t-primary bg-white p-5 sm:p-6">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-gold">{getBenefitCategoryLabel(benefit.category)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary">{benefit.name}</h1>
          {benefit.isSample && <PlaceholderTag>Sample</PlaceholderTag>}
        </div>
        <div className="mt-3">
          <BenefitStatus status={benefit.status} />
        </div>
      </header>

      {benefit.isSample && <SampleHRNotice text="This is not official ELJIN benefit information. It will be replaced with HR-approved company information." />}

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <section aria-labelledby="benefit-overview-heading">
            <h2 id="benefit-overview-heading" className={headingClass}>
              Overview
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">{benefit.description}</p>
          </section>

          <section aria-labelledby="benefit-eligibility-heading">
            <h2 id="benefit-eligibility-heading" className={headingClass}>
              Eligibility
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">{benefit.eligibility ?? 'Eligibility information has not yet been published.'}</p>
          </section>

          <section aria-labelledby="benefit-coverage-heading">
            <h2 id="benefit-coverage-heading" className={headingClass}>
              Coverage / Features
            </h2>
            {benefit.features && benefit.features.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground/85">
                {benefit.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">Official benefit details will be published here once available.</p>
            )}
          </section>

          <RelatedResources benefit={benefit} />
        </div>

        <aside className="min-w-0 space-y-6">
          <section aria-labelledby="benefit-assist-side-heading">
            <h2 id="benefit-assist-side-heading" className={headingClass}>
              Need Assistance?
            </h2>
            <div className="mt-4 flex flex-col items-start gap-2">
              <Button asChild variant="outline" className="w-full bg-white">
                <Link to="/forms/rt-hr-inquiry">Submit HR Inquiry</Link>
              </Button>
              {benefit.requestTypeId && benefit.requestTypeId !== 'rt-hr-inquiry' && (
                <Button asChild className="w-full">
                  <Link to={`/forms/${benefit.requestTypeId}`}>Ask About This Benefit</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="w-full bg-white">
                <Link to="/benefits">
                  <ArrowLeft aria-hidden="true" /> Back to Benefits
                </Link>
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}


import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

/** "Need Assistance?" block. Requests go through the existing Forms & Requests system. */
export function BenefitAssistance() {
  return (
    <section aria-labelledby="benefit-assist-heading" className="border border-l-4 border-l-primary bg-white p-5">
      <h2 id="benefit-assist-heading" className="font-serif text-xl font-semibold text-primary">
        Need Assistance?
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-foreground/85">Send HR a question or request. HR handles benefits; this portal passes your request to them.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className="bg-white">
          <Link to="/forms/rt-hr-inquiry">Submit HR Inquiry</Link>
        </Button>
        <Button asChild>
          <Link to="/forms/rt-benefits-request">Submit Benefits Request</Link>
        </Button>
      </div>
    </section>
  )
}

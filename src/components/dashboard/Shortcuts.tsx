import { Link } from 'react-router-dom'
import { SectionHeading } from '@/components/common/SectionHeading'
import { Button } from '@/components/ui/button'
import { helpdeskActions } from '@/components/helpdesk/HelpdeskQuickActions'

const box = 'border bg-white p-4'

/** Informational Benefits shortcut. It shows no amounts, balances or eligibility; HR is authoritative. */
export function BenefitsShortcut() {
  return (
    <section aria-labelledby="benefits-shortcut-heading">
      <SectionHeading id="benefits-shortcut-heading" title="Benefits & Employee Resources" />
      <div className={box}>
        <p className="text-sm text-foreground/85">Explore available benefit information, FAQs, guides, and related requests.</p>
        <Button asChild variant="outline" size="sm" className="mt-3 bg-white">
          <Link to="/benefits">View Benefits →</Link>
        </Button>
      </div>
    </section>
  )
}

const itRoutes = ['/helpdesk/new', '/helpdesk/tickets', '/helpdesk/knowledge-base']

/** IT support shortcut. Routes come from the Helpdesk's own action list. */
export function ITSupportShortcut() {
  const actions = helpdeskActions.filter((a) => itRoutes.includes(a.href))
  return (
    <section aria-labelledby="it-shortcut-heading">
      <SectionHeading id="it-shortcut-heading" title="IT Support" />
      <div className={box}>
        <p className="text-sm font-medium text-primary">Need IT assistance?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((a, i) => (
            <Button key={a.href} asChild size="sm" variant={i === 0 ? 'default' : 'outline'} className={i === 0 ? undefined : 'bg-white'}>
              <Link to={a.href}>{a.href === '/helpdesk/new' ? 'Submit IT Request' : a.label === 'My Tickets' ? 'My IT Tickets' : a.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Small careers shortcut. Job openings are sample data, so no vacancy is named here. */
export function CareersShortcut() {
  return (
    <section aria-labelledby="careers-shortcut-heading">
      <SectionHeading id="careers-shortcut-heading" title="Careers & Recruitment" />
      <div className={box}>
        <p className="text-sm text-foreground/85">View current sample opportunities, recruitment information, and employee referral options.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/recruitment">View Careers</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="bg-white">
            <Link to="/recruitment/applications">My Applications</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

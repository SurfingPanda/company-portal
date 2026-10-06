import { BookOpen, CalendarDays, ClipboardList, FileText, Headset, HeartHandshake, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionHeading } from '@/components/common/SectionHeading'

const links: { label: string; description: string; href: string; icon: LucideIcon }[] = [
  { label: 'IT Helpdesk', description: 'Submit and track IT support tickets.', href: '/helpdesk', icon: Headset },
  { label: 'Forms & Requests', description: 'Request forms and internal forms.', href: '/forms', icon: ClipboardList },
  { label: 'Documents', description: 'Policies, manuals, and templates.', href: '/documents', icon: FileText },
  { label: 'Employee Directory', description: 'Find colleagues and departments.', href: '/directory', icon: Users },
  { label: 'Benefits', description: 'Information about employee benefits.', href: '/benefits', icon: HeartHandshake },
  { label: 'Company Calendar', description: 'Schedules, holidays, and events.', href: '/calendar', icon: CalendarDays },
  { label: 'HR', description: 'HR requests, leave and recruitment.', href: '/hr', icon: Users },
  { label: 'Resource Center', description: 'Guides, forms, policies and answers.', href: '/resources', icon: BookOpen },
]

/** Compact Quick Access to the main portal areas. */
export function QuickAccess() {
  return (
    <section id="quick-access" aria-labelledby="quick-access-heading" className="scroll-mt-20">
      <SectionHeading id="quick-access-heading" title="Quick Access" />
      <ul className="grid grid-cols-2 gap-px border bg-border sm:grid-cols-4">
        {links.map(({ label, description, href, icon: Icon }) => (
          <li key={href} className="bg-white">
            <Link to={href} className="group flex h-full items-start gap-2.5 px-3 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
              <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary group-hover:text-gold" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-primary group-hover:underline">{label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

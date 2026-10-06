import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { supportLinks } from '@/data/navigation'

export function TopBar() {
  return (
    <div className="bg-navy-deep text-on-navy/70">
      <PageContainer className="flex h-8 items-center justify-between text-[0.6875rem]">
        <p className="truncate uppercase tracking-[0.18em]">
          <span className="hidden sm:inline">Eljin Corporation • </span>Employee Portal
        </p>
        <nav aria-label="Utility" className="flex items-center gap-4">
          {supportLinks.map((link) => (
            <Link key={link.href} to={link.href} className="hover:text-on-navy focus-visible:text-on-navy">
              {link.label}
            </Link>
          ))}
        </nav>
      </PageContainer>
    </div>
  )
}

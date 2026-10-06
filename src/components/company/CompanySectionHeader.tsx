import { SectionHeading, SectionLink } from '@/components/common/SectionHeading'

interface CompanySectionHeaderProps {
  id: string
  title: string
  description?: string
  /** Optional "view all" link to the full section page. */
  href?: string
  linkLabel?: string
}

export function CompanySectionHeader({ id, title, description, href, linkLabel = 'View all' }: CompanySectionHeaderProps) {
  return (
    <SectionHeading
      id={id}
      title={title}
      description={description}
      action={href ? <SectionLink href={href}>{linkLabel}</SectionLink> : undefined}
    />
  )
}

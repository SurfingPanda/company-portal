import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'

type AppLinkProps = Omit<ComponentProps<'a'>, 'href'> & { href: string }

/** Client-side route link for internal paths; plain anchor for everything else (external systems, placeholders). */
export function AppLink({ href, children, ...props }: AppLinkProps) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}

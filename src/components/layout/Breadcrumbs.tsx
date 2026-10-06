import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export interface BreadcrumbEntry {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  /** Trail after "Home". The last entry is the current page. */
  items: BreadcrumbEntry[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <Breadcrumb className="mb-3">
      <BreadcrumbList className="gap-1.5 text-xs sm:gap-1.5">
        <BreadcrumbItem>
          <Link to="/" className="text-muted-foreground transition-colors hover:text-primary hover:underline">
            Home
          </Link>
        </BreadcrumbItem>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <Fragment key={item.label}>
              <BreadcrumbSeparator className="[&>svg]:size-3" />
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage className="font-medium text-primary">{item.label}</BreadcrumbPage>
                ) : (
                  <Link to={item.href} className="text-muted-foreground transition-colors hover:text-primary hover:underline">
                    {item.label}
                  </Link>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
  as?: ElementType
}

/** Page content fills the whole screen width, with consistent gutters. Used by every page and by the shell header. */
export function PageContainer({ children, className, as: Tag = 'div' }: PageContainerProps) {
  return <Tag className={cn('mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10 2xl:px-14', className)}>{children}</Tag>
}

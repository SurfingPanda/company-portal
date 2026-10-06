import { cn } from '@/lib/utils'

interface WordmarkProps {
  className?: string
  /** Use on dark backgrounds: swaps to the light-lettered logo variant. */
  inverted?: boolean
}

/**
 * Official Eljin Corp. logo (transparent). Replace the files in /public to update it everywhere.
 * On the normal (light) variant, dark mode automatically switches to the light-lettered logo.
 */
export function Wordmark({ className, inverted }: WordmarkProps) {
  const classes = cn('h-11 w-auto', className)

  if (inverted) return <img src="/logo_light.webp" alt="Eljin Corp." className={classes} />

  return (
    <>
      <img src="/logo_main.webp" alt="Eljin Corp." className={cn(classes, 'dark:hidden')} />
      <img src="/logo_light.webp" alt="Eljin Corp." className={cn(classes, 'hidden dark:block')} />
    </>
  )
}

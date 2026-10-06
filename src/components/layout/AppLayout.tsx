import { useEffect, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DevRoleSwitcher } from '@/components/layout/DevRoleSwitcher'
import { Navbar } from '@/components/layout/Navbar'
import { TopBar } from '@/components/layout/TopBar'

interface AppLayoutProps {
  /** Page content. When omitted, the matched child route renders instead. */
  children?: ReactNode
}

/** Global shell: skip link, utility bar, navigation, page content and footer. */
export function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <TopBar />
      <Navbar />
      <main id="main-content" className="flex-1">
        {children ?? <Outlet />}
      </main>
      <DevRoleSwitcher />
    </div>
  )
}

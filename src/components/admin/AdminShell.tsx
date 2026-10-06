import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/context/AuthContext'
import { useSignOut } from '@/auth/useSignOut'
import { adminAvailable } from '@/services/admin/adminApi'

/**
 * Layout of the administration area: dark sidebar (drawer on small screens), a compact header and the page. It is a separate
 * shell from the employee portal, with its own navigation. Whether a person may be here is decided by the route guard and,
 * for every action, by Laravel; this component only lays things out.
 */
export function AdminShell() {
  const { user } = useAuth()
  const { signOut, signingOut } = useSignOut()
  const { pathname } = useLocation()
  const [drawer, setDrawer] = useState(false)

  useEffect(() => {
    setDrawer(false)
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-background">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground">
        Skip to main content
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-navy-deep text-on-navy lg:flex" aria-label="Administration">
        <AdminSidebar />
      </aside>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-72 bg-navy-deep p-0 text-on-navy [&>button]:text-on-navy">
          <SheetHeader className="sr-only">
            <SheetTitle>Administration menu</SheetTitle>
            <SheetDescription>Navigate the administration area</SheetDescription>
          </SheetHeader>
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 sm:px-6">
          <Button type="button" variant="outline" size="icon" className="lg:hidden" onClick={() => setDrawer(true)} aria-label="Open administration menu">
            <Menu aria-hidden="true" />
          </Button>
          <p className="font-serif text-lg font-semibold text-primary">Administration</p>
          <span className="hidden text-xs text-muted-foreground sm:inline">Manages the Employee Portal</span>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
              Employee portal
            </Link>
            <span className="hidden text-sm text-muted-foreground md:inline">{user?.employeeId}</span>
            <Button type="button" variant="outline" size="sm" onClick={signOut} disabled={signingOut}>
              <LogOut aria-hidden="true" /> <span className="hidden sm:inline">{signingOut ? 'Signing out…' : 'Sign out'}</span>
              <span className="sr-only sm:hidden">Sign out</span>
            </Button>
          </div>
        </header>

        <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          {adminAvailable ? (
            <Outlet />
          ) : (
            <div role="status" className="max-w-2xl border border-dashed border-muted-foreground/40 bg-white p-6 text-sm">
              <h1 className="font-serif text-xl font-semibold text-primary">Administration needs the Laravel API</h1>
              <p className="mt-2 text-muted-foreground">
                This build is running in mock mode, which has no server to manage. Start the backend and run the portal with <code>VITE_AUTH_MODE=api</code> and{' '}
                <code>VITE_DATA_MODE=api</code> to use the administration tools. No sample administration data is shown.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

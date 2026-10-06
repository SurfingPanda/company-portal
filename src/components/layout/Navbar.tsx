import { Brand } from '@/components/layout/Brand'
import { DesktopNavigation } from '@/components/layout/DesktopNavigation'
import { EmployeeMenu } from '@/components/layout/EmployeeMenu'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { GlobalSearch } from '@/components/search/GlobalSearch'

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <PageContainer className="flex h-16 items-center gap-6">
        <Brand />
        <DesktopNavigation />
        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <GlobalSearch />
          <NotificationDropdown />
          <div className="hidden lg:block">
            <EmployeeMenu />
          </div>
          <MobileNavigation />
        </div>
      </PageContainer>
    </header>
  )
}

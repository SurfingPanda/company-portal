import { ActivityList } from '@/components/activity/ActivityList'
import { DashboardAnnouncements } from '@/components/dashboard/DashboardAnnouncements'
import { Celebrations } from '@/components/dashboard/Celebrations'
import { DashboardEvents } from '@/components/dashboard/DashboardEvents'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { EmergencyContactPrompt } from '@/components/dashboard/EmergencyContactPrompt'
import { PendingPolicies } from '@/components/dashboard/PendingPolicies'
import { QuickAccess } from '@/components/dashboard/QuickAccess'
import { RecentDocuments } from '@/components/dashboard/RecentDocuments'
import { SectionBoundary } from '@/components/dashboard/SectionBoundary'
import { BenefitsShortcut, CareersShortcut, ITSupportShortcut } from '@/components/dashboard/Shortcuts'
import { RecentRequests } from '@/components/forms/RecentRequests'
import { PageContainer } from '@/components/layout/PageContainer'
import { RecentNotifications } from '@/components/notifications/RecentNotifications'
import { HomeResources } from '@/components/resources/HomeResources'

/**
 * Employee dashboard (the Home page). It only aggregates existing modules: requests, notifications, announcements,
 * events, documents, activity, resources and shortcuts. Each section loads its own data and fails on its own.
 * No payroll data (pay, leave balance, attendance) and no invented metrics appear here.
 */
export default function Home() {
  return (
    <>
      <DashboardHeader />
      <PageContainer className="space-y-10 pb-16 pt-8">
        <SectionBoundary>
          <EmergencyContactPrompt />
        </SectionBoundary>

        <SectionBoundary>
          <PendingPolicies />
        </SectionBoundary>

        <SectionBoundary>
          <QuickAccess />
        </SectionBoundary>

        {/* Highest priority: requests and notifications. */}
        <div className="grid gap-x-10 gap-y-10 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <SectionBoundary>
              <RecentRequests limit={5} />
            </SectionBoundary>
          </div>
          <div className="min-w-0">
            <SectionBoundary>
              <RecentNotifications limit={4} />
            </SectionBoundary>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <SectionBoundary>
              <DashboardAnnouncements />
            </SectionBoundary>
          </div>
          <div className="min-w-0 space-y-10">
            <SectionBoundary>
              <DashboardEvents />
            </SectionBoundary>
            <SectionBoundary>
              <Celebrations />
            </SectionBoundary>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <SectionBoundary>
              <RecentDocuments />
            </SectionBoundary>
          </div>
          <div className="min-w-0">
            <SectionBoundary>
              <ActivityList limit={5} />
            </SectionBoundary>
          </div>
        </div>

        {/* Supporting shortcuts. */}
        <div className="grid gap-x-10 gap-y-10 lg:grid-cols-3">
          <div className="min-w-0">
            <SectionBoundary>
              <HomeResources />
            </SectionBoundary>
          </div>
          <div className="min-w-0 space-y-10">
            <SectionBoundary>
              <ITSupportShortcut />
            </SectionBoundary>
            <SectionBoundary>
              <BenefitsShortcut />
            </SectionBoundary>
          </div>
          <div className="min-w-0">
            <SectionBoundary>
              <CareersShortcut />
            </SectionBoundary>
          </div>
        </div>
      </PageContainer>
    </>
  )
}

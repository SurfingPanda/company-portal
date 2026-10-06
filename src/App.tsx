import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PortalPreferencesProvider } from '@/context/PortalPreferencesContext'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import AnnouncementDetailPage from '@/pages/announcements/AnnouncementDetailPage'
import AnnouncementsPage from '@/pages/announcements/AnnouncementsPage'
import HelpdeskPage from '@/pages/helpdesk/HelpdeskPage'
import KnowledgeBaseArticlePage from '@/pages/helpdesk/KnowledgeBaseArticlePage'
import KnowledgeBasePage from '@/pages/helpdesk/KnowledgeBasePage'
import NewTicketPage from '@/pages/helpdesk/NewTicketPage'
import TicketDetailPage from '@/pages/helpdesk/TicketDetailPage'
import TicketsPage from '@/pages/helpdesk/TicketsPage'
import AccountSettingsPage from '@/pages/account/AccountSettingsPage'
import EditProfilePage from '@/pages/profile/EditProfilePage'
import ProfilePage from '@/pages/profile/ProfilePage'
import { documentCategories } from '@/data/documentCategories'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import { placeholderRoutes } from '@/data/pages'
import CalendarPage from '@/pages/calendar/CalendarPage'
import EventDetailPage from '@/pages/calendar/EventDetailPage'
import CompanyDepartments from '@/pages/company/CompanyDepartments'
import CompanyHistory from '@/pages/company/CompanyHistory'
import CompanyLeadership from '@/pages/company/CompanyLeadership'
import CompanyLocations from '@/pages/company/CompanyLocations'
import CompanyOverview from '@/pages/company/CompanyOverview'
import Directory from '@/pages/Directory'
import DocumentCategoryPage from '@/pages/documents/DocumentCategoryPage'
import DocumentDetailPage from '@/pages/documents/DocumentDetailPage'
import DocumentsPage from '@/pages/documents/DocumentsPage'
import EmployeeProfile from '@/pages/EmployeeProfile'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'
import FormDetailPage from '@/pages/forms/FormDetailPage'
import FormsPage from '@/pages/forms/FormsPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import RequestDetailPage from '@/pages/requests/RequestDetailPage'
import RequestsPage from '@/pages/requests/RequestsPage'
import HRHomePage from '@/pages/hr/HRHomePage'
import LoginPage from '@/pages/auth/LoginPage'
import SetPasswordPage from '@/pages/auth/SetPasswordPage'
import { ApiAuthHandlers } from '@/auth/ApiAuthHandlers'
import { PreferencesSync } from '@/components/settings/PreferencesSync'
import { ProtectedRoute, PublicOnlyRoute } from '@/auth/RouteGuards'
import ImportEmployeesPage from '@/pages/admin/hr/ImportEmployeesPage'
import CompanyOrganization from '@/pages/company/CompanyOrganization'
import PoliciesAdminPage from '@/pages/admin/policies/PoliciesAdminPage'
import PolicyFormPage from '@/pages/admin/policies/PolicyFormPage'
import PolicyReportPage from '@/pages/admin/policies/PolicyReportPage'
import PersonalInfoPage from '@/pages/profile/PersonalInfoPage'
import PoliciesPage from '@/pages/policies/PoliciesPage'
import PolicyDetailPage from '@/pages/policies/PolicyDetailPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import { AdminShell } from '@/components/admin/AdminShell'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import { AdminCrudFormPage } from '@/pages/admin/crud/AdminCrudFormPage'
import { AdminCrudListPage } from '@/pages/admin/crud/AdminCrudListPage'
import { announcementsConfig, benefitsConfig, calendarConfig, documentsConfig, formsConfig, jobsConfig, requestTypesConfig, resourcesConfig } from '@/pages/admin/crud/crudConfigs'
import { AdminTicketDetailPage, AdminTicketsListPage } from '@/pages/admin/helpdesk/AdminHelpdeskPages'
import { AdminApplicationsPage, AdminReferralsPage } from '@/pages/admin/recruitment/AdminRecruitmentLists'
import { AdminRequestDetailPage, AdminRequestsListPage } from '@/pages/admin/requests/AdminRequestsPages'
import { PermissionsPage, RoleDetailPage, RolesListPage } from '@/pages/admin/roles/RolesPages'
import { ActivityLogPage, AdminNotificationsPage, AdminSettingsPage, DocumentCategoriesPage } from '@/pages/admin/system/AdminSystemPages'
import ApprovalRoutingPage from '@/pages/admin/hr/ApprovalRoutingPage'
import CompanyOverviewAdminPage from '@/pages/admin/hr/CompanyOverviewAdminPage'
import EmployeeDirectoryDetailPage from '@/pages/admin/hr/EmployeeDirectoryDetailPage'
import HrDashboard from '@/pages/admin/hr/HrDashboard'
import { approvalRoutesConfig, departmentsConfig, directoryConfig, historyConfig, leadershipConfig, locationsConfig } from '@/pages/admin/hr/hrConfigs'
import UserCreatePage from '@/pages/admin/users/UserCreatePage'
import UserDetailPage from '@/pages/admin/users/UserDetailPage'
import UserEditPage from '@/pages/admin/users/UserEditPage'
import AccessTemplatesPage from '@/pages/admin/users/AccessTemplatesPage'
import { AccessEditPage, AccessListPage } from '@/pages/admin/users/UserAccessPages'
import UsersListPage from '@/pages/admin/users/UsersListPage'
import Unauthorized from '@/pages/Unauthorized'
import ResourcesPage from '@/pages/resources/ResourcesPage'
import SearchPage from '@/pages/search/SearchPage'
import HRResourcesPage from '@/pages/resources/HRResourcesPage'
import ITResourcesPage from '@/pages/resources/ITResourcesPage'
import CompanyResourcesPage from '@/pages/resources/CompanyResourcesPage'
import ResourceFAQPage from '@/pages/resources/ResourceFAQPage'
import BenefitsPage from '@/pages/benefits/BenefitsPage'
import BenefitDetailPage from '@/pages/benefits/BenefitDetailPage'
import BenefitsFAQPage from '@/pages/benefits/BenefitsFAQPage'
import BenefitsResourcesPage from '@/pages/benefits/BenefitsResourcesPage'
import RecruitmentHomePage from '@/pages/recruitment/RecruitmentHomePage'
import JobsPage from '@/pages/recruitment/JobsPage'
import JobDetailPage from '@/pages/recruitment/JobDetailPage'
import ApplyPage from '@/pages/recruitment/ApplyPage'
import ReferralPage from '@/pages/recruitment/ReferralPage'
import ApplicationsPage from '@/pages/recruitment/ApplicationsPage'
import ApplicationDetailPage from '@/pages/recruitment/ApplicationDetailPage'
import HRHubServicesPage from '@/pages/hr/HRServicesPage'
import LeavePage from '@/pages/hr/LeavePage'
import LeaveRequestPage from '@/pages/hr/LeaveRequestPage'
import LeaveRequestsPage from '@/pages/hr/LeaveRequestsPage'
import LeaveRequestDetailPage from '@/pages/hr/LeaveRequestDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <PortalPreferencesProvider>
      <AuthProvider>
      <NotificationProvider>
      <ApiAuthHandlers />
      <PreferencesSync />
      <Routes>
        {/* Public, standalone page: no portal navigation. */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        {/* Everything below requires a signed-in employee (including unknown paths). */}
        <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        {/* Administration: its own shell (not the employee layout). Each path needs its own permission (auth/routePermissions.ts); Laravel enforces the same on /api/admin. */}
        <Route element={<AdminShell />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/hr" element={<HrDashboard />} />
          <Route path="/admin/hr/employees" element={<AdminCrudListPage config={directoryConfig} />} />
          <Route path="/admin/hr/employees/import" element={<ImportEmployeesPage />} />
          <Route path="/admin/hr/employees/create" element={<AdminCrudFormPage config={directoryConfig} />} />
          <Route path="/admin/hr/employees/:id" element={<EmployeeDirectoryDetailPage />} />
          <Route path="/admin/hr/employees/:id/edit" element={<AdminCrudFormPage config={directoryConfig} />} />
          <Route path="/admin/hr/departments" element={<AdminCrudListPage config={departmentsConfig} />} />
          <Route path="/admin/hr/departments/create" element={<AdminCrudFormPage config={departmentsConfig} />} />
          <Route path="/admin/hr/departments/:id/edit" element={<AdminCrudFormPage config={departmentsConfig} />} />
          <Route path="/admin/policies" element={<PoliciesAdminPage />} />
          <Route path="/admin/policies/create" element={<PolicyFormPage />} />
          <Route path="/admin/policies/:policyId/edit" element={<PolicyFormPage />} />
          <Route path="/admin/policies/:policyId/report" element={<PolicyReportPage />} />
          <Route path="/admin/hr/approvals" element={<ApprovalRoutingPage />} />
          <Route path="/admin/hr/approvals/create" element={<AdminCrudFormPage config={approvalRoutesConfig} />} />
          <Route path="/admin/hr/approvals/:id/edit" element={<AdminCrudFormPage config={approvalRoutesConfig} />} />
          <Route path="/admin/hr/company" element={<CompanyOverviewAdminPage />} />
          <Route path="/admin/hr/company/history" element={<AdminCrudListPage config={historyConfig} />} />
          <Route path="/admin/hr/company/history/create" element={<AdminCrudFormPage config={historyConfig} />} />
          <Route path="/admin/hr/company/history/:id/edit" element={<AdminCrudFormPage config={historyConfig} />} />
          <Route path="/admin/hr/company/leadership" element={<AdminCrudListPage config={leadershipConfig} />} />
          <Route path="/admin/hr/company/leadership/create" element={<AdminCrudFormPage config={leadershipConfig} />} />
          <Route path="/admin/hr/company/leadership/:id/edit" element={<AdminCrudFormPage config={leadershipConfig} />} />
          <Route path="/admin/hr/company/locations" element={<AdminCrudListPage config={locationsConfig} />} />
          <Route path="/admin/hr/company/locations/create" element={<AdminCrudFormPage config={locationsConfig} />} />
          <Route path="/admin/hr/company/locations/:id/edit" element={<AdminCrudFormPage config={locationsConfig} />} />
          <Route path="/admin/users" element={<UsersListPage />} />
          <Route path="/admin/users/create" element={<UserCreatePage />} />
          <Route path="/admin/users/:userId" element={<UserDetailPage />} />
          <Route path="/admin/users/:userId/edit" element={<UserEditPage />} />
          <Route path="/admin/access" element={<AccessListPage />} />
          <Route path="/admin/access/templates" element={<AccessTemplatesPage />} />
          <Route path="/admin/access/:userId" element={<AccessEditPage />} />
          <Route path="/admin/roles" element={<RolesListPage />} />
          <Route path="/admin/roles/:roleId" element={<RoleDetailPage />} />
          <Route path="/admin/permissions" element={<PermissionsPage />} />
          <Route path="/admin/announcements" element={<AdminCrudListPage config={announcementsConfig} />} />
          <Route path="/admin/announcements/create" element={<AdminCrudFormPage config={announcementsConfig} />} />
          <Route path="/admin/announcements/:id/edit" element={<AdminCrudFormPage config={announcementsConfig} />} />
          <Route path="/admin/calendar" element={<AdminCrudListPage config={calendarConfig} />} />
          <Route path="/admin/calendar/create" element={<AdminCrudFormPage config={calendarConfig} />} />
          <Route path="/admin/calendar/:id/edit" element={<AdminCrudFormPage config={calendarConfig} />} />
          <Route path="/admin/documents" element={<AdminCrudListPage config={documentsConfig} />} />
          <Route path="/admin/documents/create" element={<AdminCrudFormPage config={documentsConfig} />} />
          <Route path="/admin/documents/:id/edit" element={<AdminCrudFormPage config={documentsConfig} />} />
          <Route path="/admin/forms" element={<AdminCrudListPage config={formsConfig} />} />
          <Route path="/admin/forms/create" element={<AdminCrudFormPage config={formsConfig} />} />
          <Route path="/admin/forms/:id/edit" element={<AdminCrudFormPage config={formsConfig} />} />
          <Route path="/admin/request-types" element={<AdminCrudListPage config={requestTypesConfig} />} />
          <Route path="/admin/request-types/create" element={<AdminCrudFormPage config={requestTypesConfig} />} />
          <Route path="/admin/request-types/:id/edit" element={<AdminCrudFormPage config={requestTypesConfig} />} />
          <Route path="/admin/benefits" element={<AdminCrudListPage config={benefitsConfig} />} />
          <Route path="/admin/benefits/create" element={<AdminCrudFormPage config={benefitsConfig} />} />
          <Route path="/admin/benefits/:id/edit" element={<AdminCrudFormPage config={benefitsConfig} />} />
          <Route path="/admin/resources" element={<AdminCrudListPage config={resourcesConfig} />} />
          <Route path="/admin/resources/create" element={<AdminCrudFormPage config={resourcesConfig} />} />
          <Route path="/admin/resources/:id/edit" element={<AdminCrudFormPage config={resourcesConfig} />} />
          <Route path="/admin/recruitment/jobs" element={<AdminCrudListPage config={jobsConfig} />} />
          <Route path="/admin/recruitment/jobs/create" element={<AdminCrudFormPage config={jobsConfig} />} />
          <Route path="/admin/recruitment/jobs/:id/edit" element={<AdminCrudFormPage config={jobsConfig} />} />
          <Route path="/admin/document-categories" element={<DocumentCategoriesPage />} />
          <Route path="/admin/requests" element={<AdminRequestsListPage />} />
          <Route path="/admin/requests/:requestId" element={<AdminRequestDetailPage />} />
          <Route path="/admin/helpdesk" element={<Navigate to="/admin/helpdesk/tickets" replace />} />
          <Route path="/admin/helpdesk/tickets" element={<AdminTicketsListPage />} />
          <Route path="/admin/helpdesk/tickets/:ticketId" element={<AdminTicketDetailPage />} />
          <Route path="/admin/recruitment" element={<Navigate to="/admin/recruitment/jobs" replace />} />
          <Route path="/admin/recruitment/applications" element={<AdminApplicationsPage />} />
          <Route path="/admin/recruitment/referrals" element={<AdminReferralsPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          <Route path="/admin/activity-log" element={<ActivityLogPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/helpdesk" element={<HelpdeskPage />} />
          <Route path="/helpdesk/new" element={<NewTicketPage />} />
          <Route path="/helpdesk/tickets" element={<TicketsPage />} />
          <Route path="/helpdesk/tickets/:ticketId" element={<TicketDetailPage />} />
          <Route path="/helpdesk/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/helpdesk/knowledge-base/:articleId" element={<KnowledgeBaseArticlePage />} />
          <Route path="/hr" element={<HRHomePage />} />
          <Route path="/hr/services" element={<HRHubServicesPage />} />
          <Route path="/hr/leave" element={<LeavePage />} />
          <Route path="/hr/leave/request" element={<LeaveRequestPage />} />
          <Route path="/hr/leave/requests" element={<LeaveRequestsPage />} />
          <Route path="/hr/leave/requests/:requestId" element={<LeaveRequestDetailPage />} />
          <Route path="/hr/benefits" element={<Navigate to="/benefits" replace />} />
          <Route path="/benefits" element={<BenefitsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/resources/hr" element={<HRResourcesPage />} />
          <Route path="/resources/it" element={<ITResourcesPage />} />
          <Route path="/resources/company" element={<CompanyResourcesPage />} />
          <Route path="/resources/faq" element={<ResourceFAQPage />} />
          <Route path="/benefits/faq" element={<BenefitsFAQPage />} />
          <Route path="/benefits/resources" element={<BenefitsResourcesPage />} />
          <Route path="/benefits/:benefitId" element={<BenefitDetailPage />} />
          <Route path="/recruitment" element={<RecruitmentHomePage />} />
          <Route path="/recruitment/jobs" element={<JobsPage />} />
          <Route path="/recruitment/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/recruitment/apply/:jobId" element={<ApplyPage />} />
          <Route path="/recruitment/referral/:jobId" element={<ReferralPage />} />
          <Route path="/recruitment/applications" element={<ApplicationsPage />} />
          <Route path="/recruitment/applications/:applicationId" element={<ApplicationDetailPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/announcements/:announcementId" element={<AnnouncementDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/account/settings" element={<AccountSettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/forms" element={<FormsPage />} />
          <Route path="/forms/:formId" element={<FormDetailPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/requests/:requestId" element={<RequestDetailPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/calendar/:eventId" element={<EventDetailPage />} />
          <Route path="/company" element={<CompanyOverview />} />
          <Route path="/company/history" element={<CompanyHistory />} />
          <Route path="/company/leadership" element={<CompanyLeadership />} />
          <Route path="/company/departments" element={<CompanyDepartments />} />
          <Route path="/company/organization" element={<CompanyOrganization />} />
          <Route path="/company/locations" element={<CompanyLocations />} />
          <Route path="/documents" element={<DocumentsPage />} />
          {documentCategories
            .filter((c) => !c.href.includes('?'))
            .map((c) => (
              <Route key={c.id} path={c.href} element={<DocumentCategoryPage category={c.id} />} />
            ))}
          <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
          <Route path="/profile/personal" element={<PersonalInfoPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/policies/:policyId" element={<PolicyDetailPage />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/directory/:employeeId" element={<EmployeeProfile />} />
          {placeholderRoutes.map(({ path, ...page }) => (
            <Route key={path} path={path} element={<PlaceholderPage {...page} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
        </Route>
      </Routes>
      </NotificationProvider>
      </AuthProvider>
      </PortalPreferencesProvider>
    </BrowserRouter>
  )
}

import { ADMIN_AREA_PERMISSIONS } from '@/auth/permissions'
import type { NavItem } from '@/types'

/** Single source of truth for primary navigation (desktop, mobile and footer). */
export const navigationItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Announcements', href: '/announcements' },
  { label: 'Company', href: '/company' },
  { label: 'Directory', href: '/directory' },
  { label: 'Documents', href: '/documents' },
  { label: 'Policies', href: '/policies' },
  { label: 'Calendar', href: '/calendar' },
  // Appears for anyone who manages at least one portal module (HR, IT and administrators); the admin area then shows only their modules.
  { label: 'Administration', href: '/admin', anyPermission: ADMIN_AREA_PERMISSIONS },
]

export const supportLinks: NavItem[] = [
  { label: 'Help', href: '/help' },
  { label: 'Contact MIS', href: '/contact-mis' },
]

export const employeeMenuLinks: NavItem[] = [
  { label: 'My Profile', href: '/profile' },
  { label: 'My Requests', href: '/requests' },
  { label: 'Account Settings', href: '/account/settings' },
  { label: 'Notifications', href: '/notifications' },
]

export const companyNavItems: (NavItem & { description: string })[] = [
  { label: 'Overview', href: '/company', description: 'About Eljin Corporation' },
  { label: 'History', href: '/company/history', description: 'Company milestones over the years' },
  { label: 'Leadership', href: '/company/leadership', description: 'The people guiding the company' },
  { label: 'Departments', href: '/company/departments', description: 'The departments of the company' },
  { label: 'Organization Chart', href: '/company/organization', description: 'Who reports to whom' },
  { label: 'Locations', href: '/company/locations', description: 'Offices and facilities' },
]

import type { HRResourceLink, HRService, HRServiceCategory } from '@/types/hr'

/**
 * SAMPLE DATA — NOT OFFICIAL ELJIN HR DATA.
 *
 * These are example portal services, not claims that these exact services exist at ELJIN.
 * Request services reuse the Phase 8 request types (`/forms/{requestTypeId}`); no second request
 * system exists. Replaced by `GET /api/hr/services`and `GET /api/hr/resources`.
 */

export const hrServiceCategories: HRServiceCategory[] = ['Leave', 'Employee Records', 'Benefits', 'Documents', 'HR Support', 'Recruitment', 'Other']

export const hrServices: HRService[] = [
  { id: 'hr-leave-request', name: 'Leave Request', description: 'File a leave request and track its status. Balances are handled by HR.', category: 'Leave', type: 'request', route: '/hr/leave/request', status: 'available', isFeatured: true, isSample: true },
  { id: 'hr-employment-certificate', name: 'Certificate / Employment Document Request', description: 'Ask HR for a certificate or other employment document.', category: 'Documents', type: 'request', route: '/forms/rt-employment-certificate', status: 'available', isSample: true },
  { id: 'hr-info-update', name: 'Employee Information Update Request', description: 'Ask HR to update information on your employee record.', category: 'Employee Records', type: 'request', route: '/forms/rt-employee-update', status: 'available', isFeatured: true, isSample: true },
  { id: 'hr-inquiry', name: 'HR Inquiry', description: 'Send a general question to HR.', category: 'HR Support', type: 'request', route: '/forms/rt-hr-inquiry', status: 'available', isSample: true },
  { id: 'hr-benefits-inquiry', name: 'Benefits Inquiry', description: 'Ask HR a question about employee benefits.', category: 'Benefits', type: 'request', route: '/forms/rt-benefits', status: 'available', isSample: true },
  { id: 'hr-benefits-info', name: 'Benefits & Employee Resources', description: 'Benefit information, FAQs, forms and resources.', category: 'Benefits', type: 'information', route: '/benefits', status: 'available', isSample: true },
  { id: 'hr-benefits-request', name: 'Benefits Request', description: 'Submit a request related to employee benefits.', category: 'Benefits', type: 'request', route: '/forms/rt-benefits-request', status: 'available', isSample: true },
  { id: 'hr-document-request', name: 'HR Document Request', description: 'Request a copy of an HR document.', category: 'Documents', type: 'request', route: '/forms/rt-hr-document', status: 'available', isSample: true },
  { id: 'hr-employment-verification', name: 'Employment Verification Request', description: 'Ask HR to verify your employment to a third party.', category: 'Documents', type: 'request', route: '/forms/rt-employment-verification', status: 'available', isSample: true },
  { id: 'hr-recruitment', name: 'Recruitment & Careers', description: 'View job openings, apply, or refer a candidate.', category: 'Recruitment', type: 'information', route: '/recruitment', status: 'available', isSample: true },
  { id: 'hr-other', name: 'Other HR Request', description: 'Submit an HR request that does not fit another service.', category: 'Other', type: 'request', route: '/forms/rt-other-hr', status: 'available', isSample: true },
]

export interface HRQuickLink {
  id: string
  label: string
  description: string
  icon: 'leave' | 'forms' | 'benefits' | 'employee' | 'careers' | 'documents' | 'requests'
  /** Portal route. */
  href: string
}

/** Compact links on the HR landing page and the Home page. */
export const hrQuickLinks: HRQuickLink[] = [
  { id: 'leave', label: 'Leave Requests', description: 'File and track leave', icon: 'leave', href: '/hr/leave' },
  { id: 'forms', label: 'Employee Forms', description: 'HR forms and requests', icon: 'forms', href: '/forms?category=hr' },
  { id: 'benefits', label: 'Benefits', description: 'Benefits information', icon: 'benefits', href: '/benefits' },
  { id: 'employee', label: 'Employee Information', description: 'Your profile and records', icon: 'employee', href: '/profile' },
  { id: 'careers', label: 'Recruitment & Careers', description: 'Openings and referrals', icon: 'careers', href: '/recruitment' },
  { id: 'documents', label: 'HR Documents', description: 'Policies and guides', icon: 'documents', href: '/documents?category=hr' },
  { id: 'requests', label: 'My HR Requests', description: 'Track submitted requests', icon: 'requests', href: '/requests?category=hr' },
]


/** HR document groupings. They are filters on the Documents module, not separate storage. */
export const hrResourceLinks: HRResourceLink[] = [
  { id: 'hr-policies', label: 'HR Policies', description: 'Policies and guidelines.', href: '/documents?category=policies' },
  { id: 'hr-forms', label: 'Employee Forms', description: 'Forms employees can request or download.', href: '/forms?category=hr' },
  { id: 'hr-benefits-resources', label: 'Benefits Resources', description: 'Benefits information documents.', href: '/documents?q=benefits' },
  { id: 'hr-guides', label: 'Employee Guides', description: 'Handbook and orientation material.', href: '/documents?category=hr' },
  { id: 'hr-other-resources', label: 'Other HR Resources', description: 'Everything HR has published.', href: '/documents?category=hr' },
]

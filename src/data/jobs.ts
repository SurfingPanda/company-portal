import type { EmploymentType, JobOpening, WorkArrangement } from '@/types/recruitment'

/**
 * SAMPLE DATA — Replace with HR-approved recruitment data.
 *
 * These are demonstration records, NOT actual ELJIN vacancies. Locations, work arrangements,
 * duties and qualifications are generic placeholders. No salary, hiring manager, contact number,
 * email address or real branch is included. Replaced by `GET /api/recruitment/jobs` later.
 */

export const departmentOptions = ['IT / MIS', 'Finance', 'Human Resources', 'Operations', 'Sales', 'Administration', 'Logistics', 'Other']
export const employmentTypeOptions: EmploymentType[] = ['Full-time', 'Part-time', 'Contract', 'Internship']
export const workArrangementOptions: WorkArrangement[] = ['On-site', 'Hybrid', 'Remote']
/** Placeholder locations. They are not ELJIN branches. */
export const locationOptions = ['Sample Location A', 'Sample Location B', 'Sample Location C']

type Seed = Omit<JobOpening, 'id' | 'applicationEnabled' | 'referralEnabled' | 'isSample'> & { application?: boolean; referral?: boolean }

const generic = {
  responsibilities: ['Sample responsibility: carry out day-to-day tasks for the role.', 'Sample responsibility: coordinate with other teams as needed.', 'Sample responsibility: keep accurate records of work done.'],
  qualifications: ['Sample qualification: relevant education or training.', 'Sample qualification: good written and spoken communication.'],
}

const seeds: Seed[] = [
  { title: 'IT Support Technician', department: 'IT / MIS', location: 'Sample Location A', employmentType: 'Full-time', workArrangement: 'On-site', summary: 'Sample position: provide first-line technical support to employees.', ...generic, preferredQualifications: ['Sample preference: prior help desk experience.'], skills: ['Troubleshooting', 'Hardware support', 'Customer service'], postedAt: '2026-09-24', closingDate: '2026-10-31', status: 'Open' },
  { title: 'Junior Systems Administrator', department: 'IT / MIS', location: 'Sample Location A', employmentType: 'Full-time', workArrangement: 'Hybrid', summary: 'Sample position: help maintain servers, accounts and backups.', ...generic, preferredQualifications: ['Sample preference: exposure to server administration.'], skills: ['Windows administration', 'Backups', 'Documentation'], postedAt: '2026-09-18', closingDate: '2026-11-06', status: 'Open' },
  { title: 'Network Support Technician', department: 'IT / MIS', location: 'Sample Location B', employmentType: 'Contract', workArrangement: 'On-site', summary: 'Sample position: support the installation and upkeep of office networks.', ...generic, skills: ['Networking basics', 'Cabling', 'Troubleshooting'], postedAt: '2026-09-02', closingDate: '2026-10-09', status: 'Closing Soon' },
  { title: 'MIS Assistant', department: 'IT / MIS', location: 'Sample Location A', employmentType: 'Full-time', workArrangement: 'On-site', summary: 'Sample position: assist the MIS team with records, requests and reports.', ...generic, skills: ['Office software', 'Data entry', 'Attention to detail'], postedAt: '2026-09-28', status: 'Open' },
  { title: 'Accounting Assistant', department: 'Finance', location: 'Sample Location B', employmentType: 'Full-time', workArrangement: 'On-site', summary: 'Sample position: support routine accounting and filing tasks.', ...generic, preferredQualifications: ['Sample preference: familiarity with accounting software.'], skills: ['Spreadsheets', 'Record keeping', 'Accuracy'], postedAt: '2026-09-21', closingDate: '2026-11-15', status: 'Open' },
  { title: 'HR Assistant', department: 'Human Resources', location: 'Sample Location A', employmentType: 'Full-time', workArrangement: 'On-site', summary: 'Sample position: support HR administration and employee requests.', ...generic, skills: ['Communication', 'Confidentiality', 'Office software'], postedAt: '2026-09-15', closingDate: '2026-10-30', status: 'Open' },
  { title: 'Administrative Assistant', department: 'Administration', location: 'Sample Location C', employmentType: 'Part-time', workArrangement: 'On-site', summary: 'Sample position: provide general office and administrative support.', ...generic, skills: ['Scheduling', 'Filing', 'Communication'], postedAt: '2026-09-10', status: 'Open', referral: false },
  { title: 'Sales Representative', department: 'Sales', location: 'Sample Location B', employmentType: 'Full-time', workArrangement: 'Hybrid', summary: 'Sample position: handle customer inquiries and support sales activities.', ...generic, preferredQualifications: ['Sample preference: customer-facing experience.'], skills: ['Communication', 'Negotiation basics', 'Follow-up'], postedAt: '2026-09-26', closingDate: '2026-11-20', status: 'Open' },
  { title: 'Warehouse Coordinator', department: 'Logistics', location: 'Sample Location C', employmentType: 'Full-time', workArrangement: 'On-site', summary: 'Sample position: coordinate receiving, storage and dispatch of goods.', ...generic, skills: ['Inventory tracking', 'Organization', 'Teamwork'], postedAt: '2026-09-05', closingDate: '2026-10-07', status: 'Closing Soon' },
  { title: 'Operations Assistant', department: 'Operations', location: 'Sample Location B', employmentType: 'Internship', workArrangement: 'On-site', summary: 'Sample position: learn and assist with day-to-day operations tasks.', ...generic, skills: ['Willingness to learn', 'Basic spreadsheets', 'Teamwork'], postedAt: '2026-09-29', closingDate: '2026-11-30', status: 'Open' },
  { title: 'Marketing Assistant', department: 'Other', location: 'Sample Location A', employmentType: 'Contract', workArrangement: 'Remote', summary: 'Sample position: help prepare internal and external communication material.', ...generic, skills: ['Writing', 'Design basics', 'Organization'], postedAt: '2026-08-12', closingDate: '2026-09-20', status: 'Closed', application: false, referral: false },
  { title: 'Maintenance Technician', department: 'Operations', location: 'Sample Location C', employmentType: 'Full-time', workArrangement: 'On-site', summary: 'Sample position: perform routine upkeep and repair of company facilities.', ...generic, skills: ['Basic repairs', 'Safety awareness', 'Problem solving'], postedAt: '2026-07-20', status: 'Filled', application: false, referral: false },
]

export const jobs: JobOpening[] = seeds.map(({ application, referral, ...seed }, index) => ({
  id: `job-${String(index + 1).padStart(3, '0')}`,
  ...seed,
  applicationEnabled: application ?? true,
  referralEnabled: referral ?? true,
  isSample: true,
}))

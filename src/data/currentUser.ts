import type { AuthenticatedUser } from '@/types/user'

/**
 * SAMPLE SIGNED-IN EMPLOYEE (development only).
 * Fictional data that does not represent a real Eljin employee. There is no real authentication yet.
 * This is the single source for "who is signed in"; it is replaced by `GET /api/me` once Laravel
 * authentication exists. It corresponds to directory employee EMP-001 so the two datasets agree.
 */
export const currentUser: AuthenticatedUser = {
  id: 'user-001',
  employeeId: 'EMP-001',
  directoryEmployeeId: 'EMP-001',
  firstName: 'Arvin',
  lastName: 'Leano',
  preferredName: undefined,
  workEmail: 'arvin.leano@eljin.example',
  workPhone: '+63 2 8000 0101',
  personalEmail: 'arvin.sample@example.com',
  mobileNumber: '+63 900 000 0000',
  jobTitle: 'IT Technician',
  departmentId: 'mis',
  departmentName: 'MIS',
  location: 'Head Office',
  dateJoined: '2024-03-11',
  employmentStatus: 'active',
  managerId: undefined,
  managerName: 'Sample Manager',
  profileUpdatedAt: '2026-09-12T10:30:00',
  preferences: {
    language: 'English (Philippines)',
    timezone: 'Asia/Manila',
    dateFormat: 'MMM D, YYYY',
  },
  roles: ['employee'],
  isSample: true,
}

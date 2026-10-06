import type { CalendarEvent, EventCategory, EventStatus, EventVisibility } from '@/types/event'

/**
 * SAMPLE CALENDAR EVENTS (development only).
 *
 * None of these are real Eljin Corporation events, holidays or deadlines.
 * They exist so the calendar can be built and tested around the current period.
 * Replaced by `GET /api/events` once the Laravel backend exists.
 * Dates are ISO (YYYY-MM-DD); times are 24-hour (HH:mm). Departments match the Employee Directory.
 */

interface Options {
  end?: string
  time?: [start: string, end?: string]
  department?: string
  location?: string
  organizer?: string
  status?: EventStatus
  visibility?: EventVisibility
  description?: string
}

function ev(id: string, title: string, category: EventCategory, start: string, options: Options = {}): CalendarEvent {
  const { end, time, department, location, organizer, status, visibility, description } = options
  return {
    id,
    title,
    description: description ?? `Sample event record: ${title}.`,
    startDate: start,
    endDate: end,
    startTime: time?.[0],
    endTime: time?.[1],
    category,
    department,
    location,
    isAllDay: !time,
    organizer: organizer ?? (department ? `${department} Department` : undefined),
    status: status ?? 'scheduled',
    visibility: visibility ?? 'all',
    isSample: true,
  }
}

export const events: CalendarEvent[] = [
  // September 2026
  ev('evt-001', 'Management Meeting', 'meeting', '2026-09-02', { time: ['14:00', '15:30'], department: 'Administration', location: 'Conference Room', visibility: 'department', status: 'completed' }),
  ev('evt-002', 'New Employee Orientation', 'training', '2026-09-03', { time: ['09:00', '12:00'], department: 'Human Resources', location: 'Training Room', status: 'completed' }),
  ev('evt-003', 'Inventory Review Meeting', 'meeting', '2026-09-08', { time: ['10:00', '11:30'], department: 'Operations', location: 'Warehouse Office', status: 'completed' }),
  ev('evt-004', 'IT Security Awareness Training', 'training', '2026-09-10', { time: ['14:00', '16:00'], department: 'MIS', location: 'Online', status: 'completed' }),
  ev('evt-005', 'Monthly Department Meeting', 'department-event', '2026-09-17', { time: ['10:00', '11:00'], department: 'Sales', location: 'Conference Room', status: 'completed' }),
  ev('evt-006', 'Company Anniversary Activity', 'company-event', '2026-09-20', { location: 'Head Office', organizer: 'Corporate Communications', status: 'completed' }),
  ev('evt-007', 'Payroll Processing Deadline', 'deadline', '2026-09-25', { department: 'Finance', status: 'completed' }),

  // October 2026
  ev('evt-008', 'Monthly Department Meeting', 'department-event', '2026-10-01', { time: ['10:00', '11:00'], department: 'MIS', location: 'MIS Office' }),
  ev('evt-009', 'Leave Forms Submission Deadline', 'deadline', '2026-10-01', { department: 'Human Resources', description: 'Sample deadline for submitting forms. This is not an official company deadline.' }),
  ev('evt-010', 'Company Meeting', 'company-event', '2026-10-05', { time: ['10:00', '11:30'], location: 'Main Conference Hall', organizer: 'Corporate Management' }),
  ev('evt-011', 'Staff Training', 'training', '2026-10-06', { time: ['13:00', '16:00'], department: 'Operations', location: 'Training Room 2', status: 'cancelled' }),
  ev('evt-012', 'Management Meeting', 'meeting', '2026-10-08', { time: ['14:00', '15:30'], department: 'Administration', location: 'Conference Room', visibility: 'department' }),
  ev('evt-013', 'Safety Orientation', 'training', '2026-10-10', { time: ['13:00', '15:00'], department: 'Human Resources', location: 'Training Room' }),
  ev('evt-014', 'Company Holiday', 'holiday', '2026-10-12', { organizer: 'Human Resources Department', description: 'Sample holiday entry. Not an official company holiday.' }),
  ev('evt-015', 'Inventory Review Meeting', 'meeting', '2026-10-14', { time: ['10:00', '11:30'], department: 'Operations', location: 'Warehouse Office', status: 'postponed', description: 'Sample event that has been postponed. New date to be confirmed.' }),
  ev('evt-016', 'Payroll Processing Deadline', 'deadline', '2026-10-15', { department: 'Finance' }),
  ev('evt-017', 'Marketing Planning Session', 'department-event', '2026-10-16', { time: ['15:00', '17:00'], department: 'Marketing', location: 'Online' }),
  ev('evt-018', 'Employee Wellness Week', 'employee-activity', '2026-10-19', { end: '2026-10-23', department: 'Human Resources', location: 'Head Office' }),
  ev('evt-019', 'IT Security Awareness Training', 'training', '2026-10-22', { time: ['14:00', '16:00'], department: 'MIS', location: 'Online' }),
  ev('evt-020', 'Fire and Safety Drill', 'company-event', '2026-10-22', { time: ['09:30', '10:30'], department: 'Administration', location: 'All offices' }),
  ev('evt-021', 'Sales Review Meeting', 'meeting', '2026-10-27', { time: ['09:00', '10:30'], department: 'Sales', location: 'Conference Room' }),
  ev('evt-022', 'Monthly Department Meeting', 'department-event', '2026-10-30', { time: ['10:00', '11:00'], department: 'Finance', location: 'Finance Office' }),
  ev('evt-023', 'Employee Team Activity', 'employee-activity', '2026-10-31', { time: ['15:00', '18:00'], location: 'Head Office', organizer: 'Human Resources Department' }),

  // November 2026
  ev('evt-024', 'Company Holiday', 'holiday', '2026-11-02', { organizer: 'Human Resources Department', description: 'Sample holiday entry. Not an official company holiday.' }),
  ev('evt-025', 'Quarterly Budget Submission Deadline', 'deadline', '2026-11-05', { department: 'Finance' }),
  ev('evt-026', 'New Employee Orientation', 'training', '2026-11-09', { time: ['09:00', '12:00'], department: 'Human Resources', location: 'Training Room' }),
  ev('evt-027', 'Staff Training', 'training', '2026-11-12', { time: ['13:00', '16:00'], department: 'Operations', location: 'Training Room 2' }),
  ev('evt-028', 'Management Meeting', 'meeting', '2026-11-16', { time: ['14:00', '15:30'], department: 'Administration', location: 'Conference Room', visibility: 'department' }),
  ev('evt-029', 'Year-End Planning Workshop', 'other', '2026-11-20', { time: ['09:00', '16:00'], department: 'Administration', location: 'Main Conference Hall' }),
  ev('evt-030', 'Employee Wellness Activity', 'employee-activity', '2026-11-26', { time: ['16:00', '17:30'], department: 'Human Resources', location: 'Head Office' }),
]

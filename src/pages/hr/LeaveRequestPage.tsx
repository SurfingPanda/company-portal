import { useState } from 'react'
import { HRPageShell } from '@/components/hr/HRPageShell'
import { LeaveRequestForm } from '@/components/hr/LeaveRequestForm'
import { LeaveRequestSuccess } from '@/components/hr/LeaveRequestSuccess'
import { useNotifications } from '@/context/NotificationContext'
import { getLeaveRequestType } from '@/services/hrService'
import { addActivity } from '@/services/notificationService'
import type { EmployeeRequest } from '@/types/request'

export default function LeaveRequestPage() {
  const [submitted, setSubmitted] = useState<EmployeeRequest>()
  const { addNotification } = useNotifications()
  const requestType = getLeaveRequestType()

  // Demonstrates request -> notification and activity: a real backend would create both when it stores the request.
  const handleSubmitted = (request: EmployeeRequest) => {
    setSubmitted(request)
    addNotification({
      title: 'HR request submitted',
      message: `Your leave request ${request.reference} has been submitted successfully.`,
      type: 'hr',
      href: `/hr/leave/requests/${request.id}`,
      relatedId: request.id,
    })
    void addActivity({ action: 'Submitted a leave request', description: request.reference, type: 'request', href: `/hr/leave/requests/${request.id}` })
  }

  return (
    <HRPageShell title="Leave Request" description="Request time off. HR reviews your request; the portal does not approve leave or calculate balances." trail={[{ label: 'Leave', href: '/hr/leave' }, { label: 'Leave Request' }]}>
      <div className="mx-auto max-w-3xl space-y-6">
        {submitted ? (
          <LeaveRequestSuccess request={submitted} />
        ) : (
          <>
            <LeaveRequestForm requestType={requestType} onSubmitted={handleSubmitted} />
          </>
        )}
      </div>
    </HRPageShell>
  )
}

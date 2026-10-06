import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { DirectoryErrorState } from '@/components/directory/DirectoryErrorState'
import { EmployeeContactInfo } from '@/components/directory/EmployeeContactInfo'
import { EmployeeDetails } from '@/components/directory/EmployeeDetails'
import { EmployeeProfileHeader } from '@/components/directory/EmployeeProfileHeader'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getFullName } from '@/lib/employee'
import { getEmployee } from '@/services/employeeService'

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading employee" className="space-y-8">
      <div className="flex items-center gap-5 border bg-white p-6">
        <Skeleton className="size-20 rounded-sm" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 rounded-sm" />
          <Skeleton className="h-4 w-40 rounded-sm" />
          <Skeleton className="h-4 w-32 rounded-sm" />
        </div>
      </div>
      <div className="grid gap-10 md:grid-cols-2">
        <Skeleton className="h-48 rounded-sm" />
        <Skeleton className="h-48 rounded-sm" />
      </div>
    </div>
  )
}

function EmployeeNotFound() {
  return (
    <div className="border bg-white px-6 py-12 text-center" role="status">
      <h1 className="font-serif text-2xl font-semibold text-primary">Employee Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The employee you&apos;re looking for could not be found.</p>
      <Button asChild variant="outline" className="mt-5 bg-white">
        <Link to="/directory">
          <ArrowLeft aria-hidden="true" /> Back to Directory
        </Link>
      </Button>
    </div>
  )
}

export default function EmployeeProfile() {
  const { employeeId = '' } = useParams()
  const { data: employee, error, loading, retry } = useAsync(() => getEmployee(employeeId), [employeeId])

  const trail = [
    { label: 'Employee Directory', href: '/directory' },
    { label: employee ? getFullName(employee) : loading ? 'Loading…' : 'Not found' },
  ]

  let content
  if (error) content = <DirectoryErrorState title="Unable to load this employee." onRetry={retry} />
  else if (loading && !employee) content = <ProfileSkeleton />
  else if (!employee) content = <EmployeeNotFound />
  else
    content = (
      <div className="space-y-8">
        <EmployeeProfileHeader employee={employee} />
        <div className="grid gap-10 md:grid-cols-2">
          <EmployeeContactInfo employee={employee} />
          <EmployeeDetails employee={employee} />
        </div>
      </div>
    )

  return (
    <PageContainer className="pb-16 pt-8">
      <Breadcrumbs items={trail} />
      {content}
    </PageContainer>
  )
}

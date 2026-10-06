import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'

/** Shown when a signed-in employee opens something they are not permitted to use (or the API answers 403). */
export default function Unauthorized() {
  return (
    <PageContainer className="py-16">
      <div role="alert" className="mx-auto max-w-lg border bg-white px-6 py-12 text-center">
        <ShieldAlert className="mx-auto size-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-4 font-serif text-3xl font-semibold text-primary">Access Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">You do not have permission to access this page.</p>
        <Button asChild className="mt-6">
          <Link to="/">Return to Employee Portal</Link>
        </Button>
      </div>
    </PageContainer>
  )
}

import { ArrowRight, PhoneCall } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthorization } from '@/auth/useAuthorization'
import { useAsync } from '@/hooks/useAsync'
import { isApiMode } from '@/services/dataMode'
import { getPersonalInfo } from '@/services/personalInfoService'

/** A reminder for anyone with no emergency contact on file (accounts that existed before it was asked at first sign-in). */
export function EmergencyContactPrompt() {
  const { hasPermission } = useAuthorization()
  const enabled = isApiMode && hasPermission('profile.edit')
  const { data } = useAsync(() => (enabled ? getPersonalInfo() : Promise.resolve(null)), [enabled])
  if (!data || data.emergency_contacts.length > 0) return null

  return (
    <section aria-labelledby="ec-prompt-heading" className="border border-l-4 border-l-amber-600 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <PhoneCall className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <h2 id="ec-prompt-heading" className="font-serif text-lg font-semibold text-primary">Add an emergency contact</h2>
            <p className="text-sm text-muted-foreground">HR has nobody to call if something happens to you. It takes a minute.</p>
          </div>
        </div>
        <Link to="/profile/personal" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
          Add now <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

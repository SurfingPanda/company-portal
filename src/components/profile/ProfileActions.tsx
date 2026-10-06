import { Link } from 'react-router-dom'
import { PermissionGuard } from '@/components/authorization/PermissionGuard'
import { Button } from '@/components/ui/button'

/** Compact header actions: Edit Profile and Account Settings. */
export function ProfileActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <PermissionGuard permission="profile.edit">
        <Button asChild size="sm">
          <Link to="/profile/edit">Edit Profile</Link>
        </Button>
      </PermissionGuard>
      <Button asChild variant="outline" size="sm" className="bg-white">
        <Link to="/account/settings">Account Settings</Link>
      </Button>
    </div>
  )
}

import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmployeeAvatar } from '@/components/common/EmployeeAvatar'
import { useSignOut } from '@/auth/useSignOut'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { employeeMenuLinks } from '@/data/navigation'
import { getUserFullName } from '@/lib/user'

export function EmployeeMenu() {
  const { user, isLoading } = useAuth()
  const { signOut, signingOut } = useSignOut()

  if (!user) {
    return isLoading ? (
      <div className="flex items-center gap-2.5 py-1 pl-1 pr-2" role="status" aria-label="Loading account">
        <Skeleton className="size-9 rounded-sm" />
        <Skeleton className="hidden h-8 w-28 rounded-sm xl:block" />
      </div>
    ) : null
  }

  const fullName = getUserFullName(user)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Account menu for ${fullName}`}
            className="flex items-center gap-2.5 rounded-sm py-1 pl-1 pr-2 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-accent"
          >
            <EmployeeAvatar name={fullName} imageUrl={user.avatarUrl} />
            <span className="hidden whitespace-nowrap leading-tight xl:block">
              <span className="block text-sm font-semibold text-foreground">{fullName}</span>
              <span className="block text-xs text-muted-foreground">{user.jobTitle}</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="font-normal">
            <span className="block text-sm font-semibold text-foreground">{fullName}</span>
            <span className="block text-xs text-muted-foreground">{user.jobTitle}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {employeeMenuLinks.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link to={link.href}>{link.label}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={signingOut} onSelect={() => void signOut()}>
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

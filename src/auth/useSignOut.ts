import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/** Signs the employee out (server call, then local state) and returns them to /login. Safe against double clicks. */
export function useSignOut() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const signOut = useCallback(async () => {
    if (signingOut) return
    setSigningOut(true)
    await logout()
    navigate('/login', { replace: true })
  }, [logout, navigate, signingOut])

  return { signOut, signingOut }
}

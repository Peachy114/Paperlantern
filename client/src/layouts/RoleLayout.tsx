import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface Props {
  roles: ('super_admin' | 'storyteller' | 'wanderer')[]
}

export default function RoleLayout({ roles }: Props) {
  const { user, token } = useAuthStore()

  if (!token) return <Navigate to="/" replace />
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />

  return <Outlet />
}
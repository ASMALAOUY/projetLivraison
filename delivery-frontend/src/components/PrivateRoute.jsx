import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function PrivateRoute({ children, allowedRoles }) {
  const { token, role } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role))
    return <Navigate to="/login" replace />
  return children
}
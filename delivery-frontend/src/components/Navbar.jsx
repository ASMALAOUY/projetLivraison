import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const ROLE_LINKS = {
  manager: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/map',       label: 'Carte live' },
    { to: '/orders',    label: 'Tournées'   },
  ],
  driver: [{ to: '/livreur', label: 'Mes livraisons' }],
  client: [{ to: '/suivi',   label: 'Ma livraison'   }],
}

const ROLE_STYLES = {
  manager: 'bg-blue-100 text-blue-800',
  driver:  'bg-green-100 text-green-800',
  client:  'bg-amber-100 text-amber-800',
}

const ROLE_LABELS = {
  manager: 'Gestionnaire',
  driver:  'Livreur',
  client:  'Client',
}

export default function Navbar() {
  const { user, role, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const links    = ROLE_LINKS[role] || []

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-blue-600 text-lg">DelivTrack</span>
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === l.to
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                  : 'text-gray-500 hover:text-gray-800'
              }`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_STYLES[role] || ''}`}>
            {ROLE_LABELS[role]}
          </span>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  )
}
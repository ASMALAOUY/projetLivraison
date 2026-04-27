import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const ROLE_LINKS = {
  manager: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/map',       label: 'Carte live' },
    { to: '/orders',    label: 'Tournées'   },
    { to: '/drivers',   label: 'Livreurs'   },
  ],
  driver: [{ to: '/livreur', label: 'Mes livraisons' }],
  client: [{ to: '/suivi',   label: 'Ma livraison'   }],
}

const ROLE_STYLES = {
  manager: { background: '#FFFBEB', color: '#D97706', border: '1px solid #FEF3C7' },
  driver:  { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' },
  client:  { background: '#FFFBEB', color: '#D97706', border: '1px solid #FEF3C7' },
}

const ROLE_LABELS = {
  manager: 'Gestionnaire',
  driver:  'Livreur',
  client:  'Client',
}

export default function Navbar() {
  const { user, role, logout } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const links     = ROLE_LINKS[role] || []

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <nav style={{
      background: '#1A1A18',
      borderBottom: '1px solid rgba(245,158,11,0.15)',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '0 20px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
      }}>

        {/* Logo + liens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{
            fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px',
            color: '#F59E0B',
          }}>
            DelivTrack
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {links.map(l => {
              const isActive = location.pathname === l.to
              return (
                <Link key={l.to} to={l.to} style={{
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#F59E0B' : 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(245,158,11,0.12)' : 'transparent',
                  borderBottom: isActive ? '2px solid #F59E0B' : '2px solid transparent',
                  transition: 'all .15s',
                }}>
                  {l.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Droite : rôle + avatar + nom + déco */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Badge rôle */}
          <span style={{
            fontSize: 11, fontWeight: 700,
            padding: '4px 10px', borderRadius: 20,
            ...(ROLE_STYLES[role] || ROLE_STYLES.client),
          }}>
            {ROLE_LABELS[role]}
          </span>

          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#1A1A18',
            flexShrink: 0,
          }}>
            {initials}
          </div>

          {/* Nom */}
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: 'rgba(255,255,255,0.8)',
            display: 'none',
          }}
            className="sm-show"
          >
            {user?.name}
          </span>

          {/* Bouton déconnexion */}
          <button
            onClick={() => { logout(); navigate('/login') }}
            style={{
              fontSize: 12, fontWeight: 600,
              color: '#F87171',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.2)'
              e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.1)'
              e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) { .sm-show { display: block !important; } }
        nav a:hover { color: #F59E0B !important; background: rgba(245,158,11,0.08) !important; }
      `}</style>
    </nav>
  )
}
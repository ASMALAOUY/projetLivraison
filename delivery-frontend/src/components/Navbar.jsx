import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  brand:    '#FF6B35',
  dark:     '#1A1A2E',
  bg:       '#F7F8FA',
  card:     '#FFFFFF',
  border:   '#EDEEF2',
  textSecondary: '#8A8FA8',
  green:    '#00B14F',
  red:      '#EF4444',
}

const ROLE_LINKS = {
  manager: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/map',       label: 'Carte live' },
    { to: '/orders',    label: 'Tournees'   },
    { to: '/drivers',   label: 'Livreurs'   },
  ],
  driver: [{ to: '/livreur', label: 'Mes livraisons' }],
  client: [{ to: '/suivi',   label: 'Ma livraison'   }],
}

const ROLE_STYLES = {
  manager: { background: 'rgba(255,107,53,0.12)', color: C.brand,   border: `1px solid rgba(255,107,53,0.25)` },
  driver:  { background: 'rgba(0,177,79,0.12)',   color: C.green,   border: `1px solid rgba(0,177,79,0.25)` },
  client:  { background: 'rgba(255,107,53,0.12)', color: C.brand,   border: `1px solid rgba(255,107,53,0.25)` },
}

const ROLE_LABELS = { manager: 'Gestionnaire', driver: 'Livreur', client: 'Client' }

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
      background: C.dark,
      borderBottom: `1px solid rgba(255,107,53,0.12)`,
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '0 24px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        height: 58,
      }}>

        {/* Logo + liens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: C.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 11, height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.9)' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px', color: '#fff' }}>
              DelivTrack
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {links.map(l => {
              const isActive = location.pathname === l.to
              return (
                <Link key={l.to} to={l.to} style={{
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: isActive ? C.brand : 'transparent',
                  transition: 'all .15s',
                }}>
                  {l.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Role badge */}
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
            background: C.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>
            {initials}
          </div>

          {/* Username */}
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
          }}>
            {user?.name}
          </span>

          {/* Logout button */}
          <button
            onClick={() => { logout(); navigate('/login') }}
            style={{
              fontSize: 12, fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 14px',
              cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            }}
          >
            Deconnexion
          </button>
        </div>
      </div>

      <style>{`
        nav a:hover { color: #fff !important; background: rgba(255,107,53,0.15) !important; }
      `}</style>
    </nav>
  )
}
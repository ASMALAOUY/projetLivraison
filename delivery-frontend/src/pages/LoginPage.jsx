import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'
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
}

const ROLES   = [{ key: 'manager', label: 'Gestionnaire', field: 'email', placeholder: 'email@exemple.com' }]
const REDIRECTS = { manager: '/dashboard', driver: '/livreur', client: '/suivi' }

const FEATURES = [
  'Dashboard analytique',
  'Carte GPS live',
  'Gestion livreurs',
  'Suivi commandes',
]

export default function LoginPage() {
  const [identifier, setId]   = useState('')
  const [password, setPass]   = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const body = { password, role: 'manager', email: identifier }
      const { data } = await api.post('/auth/login', body)
      login(data.token, data.user)
      navigate(REDIRECTS[data.user.role])
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants invalides')
    } finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.leftInner}>
          {/* Brand */}
          <div style={s.brand}>
            <div style={s.brandIcon}>
              <div style={s.brandIconDot} />
            </div>
            <span style={s.brandName}>DelivTrack</span>
          </div>

          {/* Live badge */}
          <div style={s.heroBadge}>
            <span style={s.heroDot} />
            <span style={s.heroBadgeText}>Disponible a Marrakech</span>
          </div>

          <h1 style={s.leftTitle}>Espace<br /><span style={s.leftAccent}>Gestionnaire.</span></h1>
          <p style={s.leftSub}>
            Gerez vos livreurs, suivez les tournees en temps reel et analysez vos performances.
          </p>

          {/* Features */}
          <div style={s.features}>
            {FEATURES.map((label, i) => (
              <div key={i} style={s.featureRow}>
                <div style={s.featureDot} />
                <span style={s.featureLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.formBox}>
          <h2 style={s.formTitle}>Connexion</h2>
          <p style={s.formSub}>Accedez a votre tableau de bord</p>

          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>EMAIL</label>
              <input
                type="email" value={identifier} onChange={e => setId(e.target.value)}
                placeholder="email@exemple.com" required style={s.input}
                onFocus={e => e.target.style.borderColor = C.brand}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>MOT DE PASSE</label>
              <input
                type="password" value={password} onChange={e => setPass(e.target.value)}
                placeholder="••••••••" required style={s.input}
                onFocus={e => e.target.style.borderColor = C.brand}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Strip */}
          <div style={s.strip}>
            {['30 min', 'GPS live', 'Paiement livraison'].map((label, i) => (
              <div key={i} style={s.stripItem}>
                <div style={s.stripDot} />
                <span style={s.stripLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' },

  // Left panel
  left:      { width: '44%', background: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 52 },
  leftInner: { maxWidth: 380 },

  brand:        { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 },
  brandIcon:    { width: 42, height: 42, background: C.brand, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandIconDot: { width: 16, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.9)' },
  brandName:    { fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' },

  heroBadge:     { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,53,0.12)', borderRadius: 20, padding: '6px 14px', marginBottom: 28, border: '1px solid rgba(255,107,53,0.2)' },
  heroDot:       { display: 'inline-block', width: 7, height: 7, borderRadius: 4, background: C.green },
  heroBadgeText: { fontSize: 12, fontWeight: 700, color: C.brand },

  leftTitle:  { fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 16, letterSpacing: -1 },
  leftAccent: { color: C.brand },
  leftSub:    { fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 36 },

  features:     { display: 'flex', flexDirection: 'column', gap: 14 },
  featureRow:   { display: 'flex', alignItems: 'center', gap: 12 },
  featureDot:   { width: 8, height: 8, borderRadius: 4, background: C.brand, flexShrink: 0 },
  featureLabel: { fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: 500 },

  // Right panel
  right:   { flex: 1, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 },
  formBox: { width: '100%', maxWidth: 400 },

  formTitle: { fontSize: 30, fontWeight: 900, color: C.dark, marginBottom: 6, letterSpacing: -0.5 },
  formSub:   { fontSize: 15, color: C.textSecondary, marginBottom: 36 },

  errorBox: {
    background: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: 12, padding: '12px 16px',
    color: '#991B1B', fontSize: 14, marginBottom: 24,
    fontWeight: 600,
  },

  form:  { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 11, fontWeight: 800, color: C.textSecondary, letterSpacing: 1.5 },
  input: {
    padding: '14px 16px', borderRadius: 13, border: `1.5px solid #EDEEF2`,
    fontSize: 15, color: C.dark, outline: 'none', background: '#fff',
    transition: 'border-color .15s',
    fontFamily: 'inherit',
  },
  btn: {
    padding: '15px', borderRadius: 14, border: 'none',
    background: C.brand, color: '#fff',
    fontSize: 16, fontWeight: 800, cursor: 'pointer',
    marginTop: 4, transition: 'opacity .15s',
    letterSpacing: 0.2,
  },

  strip:     { display: 'flex', justifyContent: 'space-around', marginTop: 44, paddingTop: 28, borderTop: `1px solid #EDEEF2` },
  stripItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  stripDot:  { width: 8, height: 8, borderRadius: 4, background: C.brand },
  stripLabel:{ fontSize: 11, color: C.textSecondary, fontWeight: 600 },
}
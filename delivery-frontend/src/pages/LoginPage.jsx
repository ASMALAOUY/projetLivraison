import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/api'
import useAuthStore from '../store/authStore'

const ROLES = [
  { key: 'manager', label: '⚙️ Gestionnaire', field: 'email', placeholder: 'email@exemple.com' },
]
const REDIRECTS = { manager: '/dashboard', driver: '/livreur', client: '/suivi' }

export default function LoginPage() {
  const [role, setRole]       = useState('manager')
  const [identifier, setId]   = useState('')
  const [password, setPass]   = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate  = useNavigate()
  const current   = ROLES.find(r => r.key === role)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const body = { password, role, [current.field]: identifier }
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
          <div style={s.brand}>
            <div style={s.brandIcon}></div>
            <span style={s.brandName}>DelivTrack</span>
          </div>
          <div style={s.heroBadge}>
            <span style={s.heroDot} />
            <span style={s.heroBadgeText}>Disponible à Marrakech</span>
          </div>
          <h1 style={s.leftTitle}>Espace<br /><span style={s.leftAccent}>Gestionnaire.</span></h1>
          <p style={s.leftSub}>Gérez vos livreurs, suivez les tournées en temps réel et analysez vos performances.</p>
          <div style={s.features}>
            {[[, 'Dashboard analytique'], [, 'Carte GPS live'], [, 'Gestion livreurs'], [, 'Suivi commandes']].map(([icon, label], i) => (
              <div key={i} style={s.featureRow}>
                <div style={s.featureIcon}>{icon}</div>
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
          <p style={s.formSub}>Accédez à votre tableau de bord</p>

          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>EMAIL</label>
              <input
                type="email" value={identifier} onChange={e => setId(e.target.value)}
                placeholder="email@exemple.com" required style={s.input}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>MOT DE PASSE</label>
              <input
                type="password" value={password} onChange={e => setPass(e.target.value)}
                placeholder="••••••••" required style={s.input}
              />
            </div>
            <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Connexion…' : 'Se connecter →'}
            </button>
          </form>

          <div style={s.strip}>
            {[[, '30 min'], [, 'GPS live'], [, 'Paiement livraison']].map(([icon, label], i) => (
              <div key={i} style={s.stripItem}>
                <span style={s.stripIcon}>{icon}</span>
                <span style={s.stripLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const YELLOW = '#F59E0B'
const DARK   = '#1A1A18'

const s = {
  page:  { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  left:  { width: '45%', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 },
  leftInner: { maxWidth: 380 },
  brand: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 },
  brandIcon: { width: 40, height: 40, background: YELLOW, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  brandName: { fontSize: 20, fontWeight: 800, color: '#fff' },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.15)', borderRadius: 20, padding: '5px 12px', marginBottom: 24 },
  heroDot:   { width: 7, height: 7, borderRadius: 4, background: '#22C55E' },
  heroBadgeText: { fontSize: 12, fontWeight: 700, color: YELLOW },
  leftTitle: { fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 16, letterSpacing: -1 },
  leftAccent:{ color: YELLOW },
  leftSub:   { fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 36 },
  features:  { display: 'flex', flexDirection: 'column', gap: 14 },
  featureRow:{ display: 'flex', alignItems: 'center', gap: 12 },
  featureIcon:{ width: 36, height: 36, background: 'rgba(245,158,11,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  featureLabel:{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 },

  right:   { flex: 1, background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 },
  formBox: { width: '100%', maxWidth: 400 },
  formTitle:{ fontSize: 30, fontWeight: 900, color: DARK, marginBottom: 6, letterSpacing: -0.5 },
  formSub:  { fontSize: 15, color: '#888', marginBottom: 32 },
  errorBox: { background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '12px 16px', color: '#92400E', fontSize: 14, marginBottom: 20 },
  form:     { display: 'flex', flexDirection: 'column', gap: 18 },
  field:    { display: 'flex', flexDirection: 'column', gap: 7 },
  label:    { fontSize: 11, fontWeight: 800, color: '#999', letterSpacing: 1.5 },
  input:    { padding: '13px 16px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 15, color: DARK, outline: 'none', background: '#fff' },
  btn:      { padding: '15px', borderRadius: 14, border: 'none', background: YELLOW, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 4 },
  strip:    { display: 'flex', justifyContent: 'space-around', marginTop: 40, paddingTop: 28, borderTop: '1px solid #EBEBEB' },
  stripItem:{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  stripIcon:{ fontSize: 20 },
  stripLabel:{ fontSize: 11, color: '#999', fontWeight: 600 },
}
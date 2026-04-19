import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/api'
import useAuthStore from '../store/authStore'

const ROLES = [
  { key: 'manager', label: 'Gestionnaire', field: 'email',  placeholder: 'email@exemple.com' },
  { key: 'driver',  label: 'Livreur',      field: 'phone',  placeholder: '06xxxxxxxx' },
  { key: 'client',  label: 'Client',       field: 'email',  placeholder: 'email@exemple.com' },
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
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = { password, role, [current.field]: identifier }
      const { data } = await api.post('/auth/login', body)
      login(data.token, data.user)
      navigate(REDIRECTS[data.user.role])
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">

        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>

        <h1 className="text-xl font-bold text-center text-gray-800 mb-1">DelivTrack</h1>
        <p className="text-sm text-gray-400 text-center mb-6">Connexion à votre espace</p>

        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
          {ROLES.map(r => (
            <button key={r.key} onClick={() => { setRole(r.key); setError(''); setId('') }}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                role === r.key
                  ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
              {r.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              {current.field === 'phone' ? 'Téléphone' : 'Email'}
            </label>
            <input
              type={current.field === 'email' ? 'email' : 'tel'}
              value={identifier}
              onChange={e => setId(e.target.value)}
              placeholder={current.placeholder}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-5">
          Pas de compte ?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
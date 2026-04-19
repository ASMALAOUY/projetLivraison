import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/api'
import useAuthStore from '../store/authStore'

const REDIRECTS = { manager: '/dashboard', driver: '/livreur', client: '/suivi' }

export default function RegisterPage() {
  const [role, setRole]       = useState('manager')
  const [form, setForm]       = useState({})
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate  = useNavigate()

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (form.password !== form.confirm) {
      return setError('Les mots de passe ne correspondent pas')
    }
    setLoading(true)
    try {
      const { confirm, ...body } = form
      const { data } = await api.post('/auth/register', { ...body, role })
      setSuccess('Compte créé ! Redirection…')
      setTimeout(() => { login(data.token, data.user); navigate(REDIRECTS[role]) }, 1000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">

        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </div>

        <h1 className="text-xl font-bold text-center text-gray-800 mb-1">Créer un compte</h1>
        <p className="text-sm text-gray-400 text-center mb-6">Choisissez votre rôle</p>

        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
          {['manager','driver','client'].map(r => (
            <button key={r} onClick={() => { setRole(r); setForm({}); setError('') }}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                role === r ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-400'
              }`}>
              {r === 'manager' ? 'Gestionnaire' : r === 'driver' ? 'Livreur' : 'Client'}
            </button>
          ))}
        </div>

        {error   && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-3">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-3">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nom complet" value={form.name||''} onChange={v=>set('name',v)} placeholder="Prénom Nom" />

          {(role === 'manager' || role === 'client') && (
            <Field label="Email" type="email" value={form.email||''} onChange={v=>set('email',v)} placeholder="email@exemple.com" />
          )}

          <Field label="Téléphone" type="tel" value={form.phone||''} onChange={v=>set('phone',v)} placeholder="06xxxxxxxx" required={role==='driver'} />

          {role === 'driver' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Véhicule</label>
              <select value={form.vehicle||''} onChange={e=>set('vehicle',e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Choisir…</option>
                <option>Moto</option>
                <option>Vélo</option>
                <option>Voiture</option>
                <option>Camionnette</option>
              </select>
            </div>
          )}

          <Field label="Mot de passe" type="password" value={form.password||''} onChange={v=>set('password',v)} placeholder="Min. 6 caractères" />
          <Field label="Confirmer" type="password" value={form.confirm||''} onChange={v=>set('confirm',v)} placeholder="••••••••" />

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 mt-1">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-5">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, type='text', value, onChange, placeholder, required=true }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      />
    </div>
  )
}
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import api from '../../api/api'

export default function DriversPage() {
  const [drivers,  setDrivers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [form,     setForm]     = useState({
    name: '', phone: '', vehicle: '', password: ''
  })
  const [creating, setCreating] = useState(false)

  const loadDrivers = async () => {
    try {
      const { data } = await api.get('/drivers')
      setDrivers(data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDrivers() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.name || !form.phone || !form.password)
      return setError('Nom, téléphone et mot de passe sont requis')
    setCreating(true)
    try {
      await api.post('/drivers', form)
      setSuccess('Livreur ajouté avec succès !')
      setForm({ name: '', phone: '', vehicle: '', password: '' })
      setShowForm(false)
      await loadDrivers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/drivers/${id}/status`)
      await loadDrivers()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer le livreur "${name}" ? Cette action est irréversible.`))
      return
    setDeleting(id)
    setError('')
    try {
      await api.delete(`/drivers/${id}`)
      setSuccess(`Livreur "${name}" supprimé.`)
      await loadDrivers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  const VEHICLES = ['Moto', 'Vélo', 'Voiture', 'Camionnette']

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestion des livreurs</h1>
            <p className="text-sm text-gray-400 mt-0.5">{drivers.length} livreur(s) enregistré(s)</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              showForm
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
            {showForm ? '✕ Annuler' : '+ Ajouter un livreur'}
          </button>
        </div>

        {/* Messages */}
        {error   && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <span>❌</span> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <span>✅</span> {success}
          </div>
        )}

        {/* Formulaire d'ajout */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="font-bold text-white text-lg">Nouveau livreur</h2>
              <p className="text-blue-200 text-sm mt-0.5">Remplissez les informations du livreur</p>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Prénom Nom"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="06xxxxxxxx"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Véhicule
                  </label>
                  <select
                    value={form.vehicle}
                    onChange={e => setForm({...form, vehicle: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Choisir un véhicule…</option>
                    {VEHICLES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="Min. 6 caractères"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Création…</>
                  ) : '✓ Ajouter le livreur'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError('') }}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des livreurs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"/>
              <p className="text-sm text-gray-400">Chargement…</p>
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">👤</div>
              <p className="font-semibold text-gray-600">Aucun livreur enregistré</p>
              <p className="text-sm text-gray-400 mt-1">Cliquez sur "Ajouter un livreur" pour commencer</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Livreur</th>
                  <th className="px-6 py-3 text-left">Téléphone</th>
                  <th className="px-6 py-3 text-left">Véhicule</th>
                  <th className="px-6 py-3 text-left">Statut</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                          {d.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{d.name}</p>
                          <p className="text-xs text-gray-400">ID: {d.id.slice(0,8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{d.phone || '—'}</td>
                    <td className="px-6 py-4">
                      {d.vehicle ? (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium">
                          {d.vehicle === 'Moto' ? '🏍️' :
                           d.vehicle === 'Vélo' ? '🚲' :
                           d.vehicle === 'Voiture' ? '🚗' : '🚐'} {d.vehicle}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.status}/>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Activer / Désactiver */}
                        <button
                          onClick={() => toggleStatus(d.id)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                            d.status === 'active'
                              ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}>
                          {d.status === 'active' ? '⏸ Désactiver' : '▶ Activer'}
                        </button>

                        {/* Supprimer */}
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
                          disabled={deleting === d.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-40"
                        >
                          {deleting === d.id ? '…' : '🗑 Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../api/api'

export default function OrdersPage() {
  const [orders,   setOrders]   = useState([])
  const [drivers,  setDrivers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState({ driverId: '', date: '' })
  const [points,   setPoints]   = useState([])
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)

  // Formulaire ajout de point
  const [showAddPoint, setShowAddPoint] = useState(false)
  const [addingPoint,  setAddingPoint]  = useState(false)
  const [pointForm,    setPointForm]    = useState({
    clientName: '', address: '', phone: '', note: ''
  })
  const [pointError,   setPointError]   = useState('')
  const [pointSuccess, setPointSuccess] = useState('')

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/orders')
      setOrders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    api.get('/drivers').then(r => setDrivers(r.data)).catch(() => {})
  }, [])

  const createOrder = async () => {
    if (!form.driverId || !form.date) return
    setCreating(true)
    try {
      await api.post('/orders', form)
      setForm({ driverId: '', date: '' })
      await loadOrders()
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const viewPoints = async (orderId) => {
    if (selected === orderId) {
      setSelected(null); setPoints([])
      setShowAddPoint(false); setPointError(''); setPointSuccess('')
      return
    }
    setSelected(orderId)
    setShowAddPoint(false)
    const { data } = await api.get(`/points/order/${orderId}`)
    setPoints(data)
  }

  const handleAddPoint = async (e) => {
    e.preventDefault()
    setPointError(''); setPointSuccess('')
    if (!pointForm.clientName.trim() || !pointForm.address.trim()) {
      setPointError('Nom du client et adresse sont obligatoires')
      return
    }
    setAddingPoint(true)
    try {
      await api.post('/points', {
        orderId:    selected,
        clientName: pointForm.clientName,
        address:    pointForm.address,
        latitude:   31.6295,
        longitude:  -7.9811,
        sequence:   points.length + 1,
        failureNote: pointForm.note || null,
      })
      setPointSuccess(`Point n°${points.length + 1} ajouté avec succès !`)
      setPointForm({ clientName: '', address: '', phone: '', note: '' })
      // Recharger les points
      const { data } = await api.get(`/points/order/${selected}`)
      setPoints(data)
      setTimeout(() => setPointSuccess(''), 3000)
    } catch (err) {
      setPointError(err.response?.data?.error || 'Erreur lors de l\'ajout')
    } finally {
      setAddingPoint(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des tournées</h1>

        {/* Formulaire nouvelle tournée */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Nouvelle tournée</h2>
          <div className="flex gap-3 flex-wrap">
            <select
              value={form.driverId}
              onChange={e => setForm({ ...form, driverId: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Choisir un livreur…</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} — {d.vehicle}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={createOrder}
              disabled={!form.driverId || !form.date || creating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40"
            >
              {creating ? 'Création…' : '+ Créer'}
            </button>
          </div>
          {drivers.length === 0 && (
            <p className="text-xs text-orange-500 mt-3">
              ⚠️ Aucun livreur trouvé — créez d'abord un compte livreur
            </p>
          )}
        </div>

        {/* Liste des tournées */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? <LoadingSpinner /> : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucune tournée créée</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Livreur</th>
                  <th className="px-6 py-3 text-left">Véhicule</th>
                  <th className="px-6 py-3 text-left">Points</th>
                  <th className="px-6 py-3 text-left">Statut</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <React.Fragment key={o.id}>
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium">{o.date}</td>
                      <td className="px-6 py-4 text-gray-600">{o.Driver?.name || '—'}</td>
                      <td className="px-6 py-4 text-gray-500">{o.Driver?.vehicle || '—'}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {o.DeliveryPoints?.length ?? 0} point(s)
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewPoints(o.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"
                        >
                          {selected === o.id ? 'Masquer ▲' : 'Voir points ▼'}
                        </button>
                      </td>
                    </tr>

                    {selected === o.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-blue-50">

                          {/* Liste des points existants */}
                          {points.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-2 mb-3">
                              Aucun point de livraison — ajoutez-en ci-dessous
                            </p>
                          ) : (
                            <div className="space-y-2 mb-4">
                              {points.map(p => {
                                let items = p.items || []
                                if (typeof items === 'string') {
                                  try { items = JSON.parse(items) } catch { items = [] }
                                }
                                return (
                                  <div key={p.id}
                                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-blue-100">
                                    <div className="flex items-center gap-3">
                                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                        {p.sequence}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-800">{p.clientName}</p>
                                        <p className="text-xs text-gray-400">{p.address}</p>
                                        {items.length > 0 && (
                                          <div className="flex gap-1 mt-1">
                                            {items.map((item, i) => (
                                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                {item.emoji} {item.name} ×{item.qty}
                                              </span>
                                            ))}
                                            {p.totalPrice && (
                                              <span className="text-xs font-bold text-blue-600 ml-1">
                                                {p.totalPrice} MAD
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        {p.failureNote && (
                                          <p className="text-xs text-red-500 mt-0.5">
                                            Note : {p.failureNote}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <StatusBadge status={p.status} />
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Bouton afficher/masquer formulaire */}
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              {points.length} point(s) de passage
                            </p>
                            <button
                              onClick={() => {
                                setShowAddPoint(!showAddPoint)
                                setPointError(''); setPointSuccess('')
                                setPointForm({ clientName: '', address: '', phone: '', note: '' })
                              }}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                                showAddPoint
                                  ? 'border-gray-300 text-gray-500 hover:bg-gray-100'
                                  : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              {showAddPoint ? '✕ Annuler' : '+ Ajouter un point'}
                            </button>
                          </div>

                          {/* Formulaire ajout de point */}
                          {showAddPoint && (
                            <form onSubmit={handleAddPoint}
                              className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
                              <p className="text-sm font-semibold text-gray-700">
                                Nouveau point de livraison — n°{points.length + 1}
                              </p>

                              {pointError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">
                                  {pointError}
                                </div>
                              )}
                              {pointSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">
                                  {pointSuccess}
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    Nom du client *
                                  </label>
                                  <input
                                    type="text"
                                    value={pointForm.clientName}
                                    onChange={e => setPointForm({ ...pointForm, clientName: e.target.value })}
                                    placeholder="Ex: Ahmed Benali"
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    Téléphone
                                  </label>
                                  <input
                                    type="tel"
                                    value={pointForm.phone}
                                    onChange={e => setPointForm({ ...pointForm, phone: e.target.value })}
                                    placeholder="Ex: 0612345678"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                  Adresse de livraison *
                                </label>
                                <input
                                  type="text"
                                  value={pointForm.address}
                                  onChange={e => setPointForm({ ...pointForm, address: e.target.value })}
                                  placeholder="Ex: 12 Rue Mohammed V, Marrakech"
                                  required
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                  Instructions (optionnel)
                                </label>
                                <input
                                  type="text"
                                  value={pointForm.note}
                                  onChange={e => setPointForm({ ...pointForm, note: e.target.value })}
                                  placeholder="Ex: Sonnez au portail, 2ème étage…"
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  type="submit"
                                  disabled={addingPoint}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {addingPoint ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Ajout…</>
                                  ) : `✓ Ajouter le point n°${points.length + 1}`}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setShowAddPoint(false); setPointError('') }}
                                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50"
                                >
                                  Annuler
                                </button>
                              </div>
                            </form>
                          )}

                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
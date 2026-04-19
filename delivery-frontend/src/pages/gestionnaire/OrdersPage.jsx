import { useEffect, useState } from 'react'
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

  const loadOrders = async () => {
    const { data } = await api.get('/orders')
    setOrders(data); setLoading(false)
  }

  useEffect(() => {
    loadOrders()
    api.get('/drivers').then(r => setDrivers(r.data))
  }, [])

  const createOrder = async () => {
    if (!form.driverId || !form.date) return
    setCreating(true)
    await api.post('/orders', form)
    setForm({ driverId: '', date: '' })
    await loadOrders()
    setCreating(false)
  }

  const viewPoints = async (orderId) => {
    if (selected === orderId) { setSelected(null); setPoints([]); return }
    setSelected(orderId)
    const { data } = await api.get(`/points/order/${orderId}`)
    setPoints(data)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des tournées</h1>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Nouvelle tournée</h2>
          <div className="flex gap-3 flex-wrap">
            <select value={form.driverId} onChange={e=>setForm({...form, driverId: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">Choisir un livreur…</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.vehicle}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            <button onClick={createOrder} disabled={!form.driverId || !form.date || creating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40">
              {creating ? 'Création…' : '+ Créer'}
            </button>
          </div>
        </div>

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
                  <th className="px-6 py-3 text-left">Statut</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <>
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium">{o.date}</td>
                      <td className="px-6 py-4 text-gray-600">{o.Driver?.name || '—'}</td>
                      <td className="px-6 py-4 text-gray-500">{o.Driver?.vehicle || '—'}</td>
                      <td className="px-6 py-4"><StatusBadge status={o.status}/></td>
                      <td className="px-6 py-4">
                        <button onClick={() => viewPoints(o.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline">
                          {selected === o.id ? 'Masquer' : 'Voir points'}
                        </button>
                      </td>
                    </tr>
                    {selected === o.id && (
                      <tr key={o.id+'-pts'}>
                        <td colSpan={5} className="px-6 py-3 bg-blue-50">
                          {points.length === 0 ? (
                            <p className="text-xs text-gray-400">Aucun point de livraison</p>
                          ) : (
                            <div className="space-y-2">
                              {points.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-blue-100">
                                  <div>
                                    <p className="text-sm font-medium">{p.sequence}. {p.clientName}</p>
                                    <p className="text-xs text-gray-400">{p.address}</p>
                                    {p.failureNote && <p className="text-xs text-red-500 mt-0.5">Note : {p.failureNote}</p>}
                                  </div>
                                  <StatusBadge status={p.status}/>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
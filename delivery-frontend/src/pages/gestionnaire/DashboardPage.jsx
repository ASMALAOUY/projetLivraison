import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../api/api'

export default function DashboardPage() {
  const [orders,  setOrders]  = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([api.get('/orders'), api.get('/drivers')])
      .then(([o, d]) => { setOrders(o.data); setDrivers(d.data) })
      .catch(err => console.error('Dashboard error:', err.response?.data || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // Rafraîchissement automatique toutes les 30s
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  // Statistiques — inclure TOUS les statuts
  const total           = orders.length
  const done            = orders.filter(o => o.status === 'done').length
  const inProgress      = orders.filter(o => o.status === 'in_progress').length
  const planned         = orders.filter(o => o.status === 'planned').length
  const waitingAccept   = orders.filter(o => o.status === 'pending_acceptance').length
  const rate            = total ? Math.round((done / total) * 100) : 0

  // Tous les points de livraison
  const allPoints  = orders.flatMap(o => o.DeliveryPoints || [])
  const ptDelivered= allPoints.filter(p => p.status === 'delivered').length
  const ptFailed   = allPoints.filter(p => p.status === 'failed').length
  const ptPending  = allPoints.filter(p => p.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
          <button onClick={load}
            className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-50 transition">
            Actualiser
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {/* ── KPI Tournées ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total commandes',    value: total,         border: 'border-blue-400',   txt: 'text-blue-700' },
                { label: 'En attente acceptation', value: waitingAccept, border: 'border-orange-400', txt: 'text-orange-600' },
                { label: 'En cours',           value: inProgress + planned, border: 'border-yellow-400', txt: 'text-yellow-700' },
                { label: 'Taux de succès',     value: `${rate}%`,    border: 'border-purple-400', txt: 'text-purple-700' },
              ].map(({ label, value, border, txt }) => (
                <div key={label} className={`bg-white rounded-2xl p-5 border-l-4 ${border} shadow-sm`}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${txt}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── KPI Points de livraison ── */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Points livrés',     value: ptDelivered, color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
                { label: 'Points en attente', value: ptPending,   color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
                { label: 'Points échoués',    value: ptFailed,    color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200'   },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} className={`${bg} rounded-2xl p-4 border ${border}`}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              {/* ── Livreurs ── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-700 mb-4">
                  Livreurs ({drivers.length})
                </h2>
                {drivers.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400">Aucun livreur enregistré</p>
                    <p className="text-xs text-gray-300 mt-1">Créez un compte livreur via /register</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drivers.map(d => {
                      // Compter les commandes actives de ce livreur
                      const activeCount = orders.filter(
                        o => o.driverId === d.id &&
                             (o.status === 'planned' || o.status === 'in_progress')
                      ).length

                      return (
                        <div key={d.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                            {d.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                            <p className="text-xs text-gray-400">{d.vehicle} · {d.phone}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {activeCount > 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                {activeCount} en cours
                              </span>
                            )}
                            <StatusBadge status={d.status} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Dernières tournées / commandes ── */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-700 mb-4">
                  Dernières commandes ({total})
                </h2>
                {orders.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400">Aucune commande passée</p>
                    <p className="text-xs text-gray-300 mt-1">Les commandes clients apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 8).map(o => {
                      const pts = o.DeliveryPoints || []
                      const clientName = pts[0]?.clientName || '—'
                      const items = (() => {
                        try {
                          const raw = pts[0]?.items
                          return typeof raw === 'string' ? JSON.parse(raw) : (raw || [])
                        } catch { return [] }
                      })()

                      return (
                        <div key={o.id}
                          className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Emojis articles */}
                            {items.length > 0 ? (
                              <div className="flex gap-0.5 flex-shrink-0">
                                {items.slice(0, 3).map((item, i) => (
                                  <span key={i} className="text-base">{item.emoji}</span>
                                ))}
                                {items.length > 3 && (
                                  <span className="text-xs text-gray-400 self-center">+{items.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs">📦</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{clientName}</p>
                              <p className="text-xs text-gray-400">
                                {o.Driver?.name || 'Non assigné'} · {o.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {pts[0]?.totalPrice > 0 && (
                              <span className="text-xs font-bold text-blue-600">{pts[0].totalPrice} MAD</span>
                            )}
                            <StatusBadge status={o.status} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Commandes en attente d'acceptation ── */}
            {waitingAccept > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  <h2 className="font-semibold text-orange-800">
                    {waitingAccept} commande{waitingAccept > 1 ? 's' : ''} en attente d'un livreur
                  </h2>
                </div>
                <div className="space-y-2">
                  {orders
                    .filter(o => o.status === 'pending_acceptance')
                    .map(o => {
                      const pts = o.DeliveryPoints || []
                      const items = (() => {
                        try {
                          const raw = pts[0]?.items
                          return typeof raw === 'string' ? JSON.parse(raw) : (raw || [])
                        } catch { return [] }
                      })()
                      return (
                        <div key={o.id}
                          className="bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-orange-100">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-0.5">
                              {items.slice(0, 3).map((item, i) => (
                                <span key={i} className="text-base">{item.emoji}</span>
                              ))}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {pts[0]?.clientName || '—'}
                              </p>
                              <p className="text-xs text-gray-500">{pts[0]?.address || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {pts[0]?.totalPrice > 0 && (
                              <span className="text-sm font-bold text-orange-600">{pts[0].totalPrice} MAD</span>
                            )}
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                              En attente
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
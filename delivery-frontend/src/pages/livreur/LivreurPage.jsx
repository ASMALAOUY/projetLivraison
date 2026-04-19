import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../api/api'

export default function LivreurPage() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [gpsOn,   setGpsOn]   = useState(false)
  const [error,   setError]   = useState('')

  const loadOrders = async () => {
    try {
      setError('')
      const { data } = await api.get('/drivers/me/orders')
      console.log('Commandes reçues:', data)
      setOrders(data)
    } catch (err) {
      console.error('Erreur livreur:', err)
      setError('Erreur : ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()

    if (navigator.geolocation) {
      setGpsOn(true)
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(pos => {
          api.post('/tracking/gps', {
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
          }).catch(() => {})
        })
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  const updateStatus = async (pointId, status) => {
    const failureNote = status === 'failed'
      ? window.prompt("Raison de l'échec :") : null
    try {
      await api.patch(`/points/${pointId}/status`, { status, failureNote })
      await loadOrders()
    } catch (err) {
      alert('Erreur : ' + (err.response?.data?.error || err.message))
    }
  }

  const allPoints = orders.flatMap(o => o.DeliveryPoints || [])
  const delivered = allPoints.filter(p => p.status === 'delivered').length
  const failed    = allPoints.filter(p => p.status === 'failed').length
  const pending   = allPoints.filter(p => p.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Mes livraisons</h1>
          <div className="flex items-center gap-2">
            {gpsOn && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                GPS actif
              </div>
            )}
            <button onClick={loadOrders}
              className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-50">
              Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {!loading && allPoints.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Livrés',     value: delivered, color: 'text-green-600' },
              { label: 'En attente', value: pending,   color: 'text-blue-600' },
              { label: 'Échecs',     value: failed,    color: 'text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl p-3 text-center border border-gray-100">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-gray-600">Aucune livraison assignée</p>
            <p className="text-sm text-gray-400 mt-1">
              Les commandes des clients apparaîtront ici
            </p>
            <button onClick={loadOrders}
              className="mt-4 text-sm text-blue-600 hover:underline">
              Rafraîchir
            </button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-800">Tournée — {order.date}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(order.DeliveryPoints || []).length} point(s) de livraison
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="divide-y divide-gray-50">
                {(order.DeliveryPoints || []).length === 0 ? (
                  <div className="px-5 py-4 text-sm text-gray-400 text-center">
                    Aucun point de livraison dans cette tournée
                  </div>
                ) : (
                  (order.DeliveryPoints || [])
                    .sort((a, b) => a.sequence - b.sequence)
                    .map(pt => {
                      // Parser les items si c'est une string
                      let items = pt.items || []
                      if (typeof items === 'string') {
                        try { items = JSON.parse(items) } catch { items = [] }
                      }

                      return (
                        <div key={pt.id} className="px-5 py-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {pt.sequence}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{pt.clientName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{pt.address}</p>

                                {/* Articles commandés */}
                                {items.length > 0 && (
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    {items.map((item, i) => (
                                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                        {item.emoji} {item.name} x{item.qty}
                                      </span>
                                    ))}
                                    {pt.totalPrice && (
                                      <span className="text-xs font-bold text-blue-600">
                                        {pt.totalPrice} MAD
                                      </span>
                                    )}
                                  </div>
                                )}

                                {pt.pickupAddress && (
                                  <p className="text-xs text-orange-500 mt-1">
                                    📍 Récupérer chez : {pt.pickupAddress}
                                  </p>
                                )}

                                {pt.failureNote && (
                                  <p className="text-xs text-red-500 mt-1 bg-red-50 px-2 py-1 rounded">
                                    Note : {pt.failureNote}
                                  </p>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={pt.status} />
                          </div>

                          {/* Boutons d'action */}
                          {pt.status !== 'delivered' && pt.status !== 'failed' && (
                            <div className="flex gap-2 ml-10 flex-wrap">
                              {[
                                { v: 'in_progress', l: 'Démarrer',  c: 'border-blue-300 text-blue-700 hover:bg-blue-50' },
                                { v: 'delivered',   l: '✓ Livré',   c: 'border-green-300 text-green-700 hover:bg-green-50' },
                                { v: 'failed',      l: '✗ Échec',   c: 'border-red-300 text-red-700 hover:bg-red-50' },
                              ].map(a => (
                                <button key={a.v}
                                  onClick={() => updateStatus(pt.id, a.v)}
                                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${a.c}`}>
                                  {a.l}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
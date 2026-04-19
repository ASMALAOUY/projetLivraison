import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../api/api'

export default function LivreurPage() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [gpsOn,   setGpsOn]   = useState(false)

  const loadOrders = async () => {
    const { data } = await api.get('/drivers/me/orders')
    setOrders(data); setLoading(false)
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
          })
        })
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  const updateStatus = async (pointId, status) => {
    const failureNote = status === 'failed'
      ? window.prompt("Raison de l'échec :") : null
    await api.patch(`/points/${pointId}/status`, { status, failureNote })
    loadOrders()
  }

  const allPoints   = orders.flatMap(o => o.DeliveryPoints || [])
  const delivered   = allPoints.filter(p => p.status === 'delivered').length
  const failed      = allPoints.filter(p => p.status === 'failed').length
  const pending     = allPoints.filter(p => p.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Mes livraisons du jour</h1>
          {gpsOn && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
              GPS actif
            </div>
          )}
        </div>

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
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">Aucune livraison aujourd'hui</p>
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <p className="font-semibold text-gray-800">Tournée du {order.date}</p>
                <p className="text-xs text-gray-400">{(order.DeliveryPoints||[]).length} points</p>
              </div>
              <StatusBadge status={order.status}/>
            </div>
            <div className="divide-y divide-gray-50">
              {(order.DeliveryPoints||[]).map(pt => (
                <div key={pt.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {pt.sequence}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{pt.clientName}</p>
                        <p className="text-xs text-gray-400">{pt.address}</p>
                        {pt.failureNote && (
                          <p className="text-xs text-red-500 mt-1 bg-red-50 px-2 py-1 rounded">
                            {pt.failureNote}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={pt.status}/>
                  </div>
                  {pt.status !== 'delivered' && pt.status !== 'failed' && (
                    <div className="flex gap-2 ml-10">
                      {[
                        { v: 'in_progress', l: 'Démarrer', c: 'border-blue-300 text-blue-700 hover:bg-blue-50' },
                        { v: 'delivered',   l: 'Livré',    c: 'border-green-300 text-green-700 hover:bg-green-50' },
                        { v: 'failed',      l: 'Échec',    c: 'border-red-300 text-red-700 hover:bg-red-50' },
                      ].map(a => (
                        <button key={a.v} onClick={() => updateStatus(pt.id, a.v)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${a.c}`}>
                          {a.l}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
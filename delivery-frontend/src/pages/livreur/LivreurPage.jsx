import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../api/api'

export default function LivreurPage() {
  const [available, setAvailable] = useState([]) // commandes ouvertes
  const [myOrders,  setMyOrders]  = useState([]) // mes commandes acceptées
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('available') // 'available' | 'mine'
  const [gpsOn,     setGpsOn]     = useState(false)
  const [accepting, setAccepting] = useState(null)

  const loadData = async () => {
    try {
      const [avRes, myRes] = await Promise.all([
        api.get('/drivers/available-orders'),
        api.get('/drivers/me/orders'),
      ])
      setAvailable(avRes.data)
      setMyOrders(myRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const refresh = setInterval(loadData, 15000)

    if (navigator.geolocation) {
      setGpsOn(true)
      const gps = setInterval(() => {
        navigator.geolocation.getCurrentPosition(pos => {
          api.post('/tracking/gps', {
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
          }).catch(() => {})
        })
      }, 30000)
      return () => { clearInterval(refresh); clearInterval(gps) }
    }
    return () => clearInterval(refresh)
  }, [])

  const acceptOrder = async (orderId) => {
    setAccepting(orderId)
    try {
      await api.post(`/drivers/accept-order/${orderId}`)
      setTab('mine')
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'acceptation')
    } finally {
      setAccepting(null)
    }
  }

  const updateStatus = async (pointId, status) => {
    const failureNote = status === 'failed'
      ? window.prompt("Raison de l'échec :") : null
    try {
      await api.patch(`/points/${pointId}/status`, { status, failureNote })
      await loadData()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  const allMyPoints  = myOrders.flatMap(o => o.DeliveryPoints || [])
  const delivered    = allMyPoints.filter(p => p.status === 'delivered').length
  const inProgress   = allMyPoints.filter(p => p.status === 'in_progress').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Livraisons</h1>
          <div className="flex items-center gap-2">
            {gpsOn && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                GPS actif
              </div>
            )}
            <button onClick={loadData}
              className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-50">
              Actualiser
            </button>
          </div>
        </div>

        {/* Stats */}
        {myOrders.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
              <p className="text-2xl font-bold text-green-600">{delivered}</p>
              <p className="text-xs text-gray-400">Livrés</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
              <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
              <p className="text-xs text-gray-400">En cours</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setTab('available')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
              tab === 'available' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
            }`}>
            Nouvelles commandes
            {available.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {available.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
              tab === 'mine' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
            }`}>
            Mes livraisons
            {myOrders.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {myOrders.length}
              </span>
            )}
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (

          // ── TAB: Commandes disponibles ────────────────────────
          tab === 'available' ? (
            available.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-semibold text-gray-600">Aucune commande disponible</p>
                <p className="text-sm text-gray-400 mt-1">Les nouvelles commandes apparaissent ici</p>
              </div>
            ) : (
              <div className="space-y-3">
                {available.map(order => {
                  const points = order.DeliveryPoints || []
                  const allItems = points.flatMap(p => p.items || [])
                  const total    = points.reduce((s, p) => s + (p.totalPrice || 0), 0)

                  return (
                    <div key={order.id}
                      className="bg-white rounded-2xl border-2 border-orange-100 shadow-sm overflow-hidden">

                      {/* Badge nouvelle commande */}
                      <div className="bg-orange-50 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"/>
                          <span className="text-xs font-bold text-orange-600">NOUVELLE COMMANDE</span>
                        </div>
                        <span className="text-xs text-gray-400">{order.date}</span>
                      </div>

                      <div className="p-4">
                        {points.map(pt => (
                          <div key={pt.id} className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-bold text-gray-800">{pt.clientName}</span>
                            </div>

                            <div className="flex items-start gap-2 text-sm text-gray-500 mb-1">
                              <span>🏠</span>
                              <span>{pt.address}</span>
                            </div>

                            {pt.pickupAddress && (
                              <div className="flex items-start gap-2 text-sm text-orange-500 mb-2">
                                <span>📍</span>
                                <span>Récupérer chez : {pt.pickupAddress}</span>
                              </div>
                            )}

                            {(pt.items || []).length > 0 && (
                              <div className="flex gap-1.5 flex-wrap mt-2">
                                {(pt.items || []).map((item, i) => (
                                  <span key={i}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                    {item.emoji} {item.name} ×{item.qty}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <span className="font-bold text-blue-600 text-lg">{total} MAD</span>
                          <button
                            onClick={() => acceptOrder(order.id)}
                            disabled={accepting === order.id}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl transition disabled:opacity-50 flex items-center gap-2">
                            {accepting === order.id
                              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Acceptation…</>
                              : '✓ Accepter la commande'
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )

          // ── TAB: Mes livraisons acceptées ─────────────────────
          ) : (
            myOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-3">🚴</p>
                <p className="font-semibold text-gray-600">Aucune livraison en cours</p>
                <p className="text-sm text-gray-400 mt-1">Acceptez une commande dans l'onglet "Nouvelles commandes"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map(order => (
                  <div key={order.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-800">Tournée — {order.date}</p>
                        <p className="text-xs text-gray-400">{(order.DeliveryPoints||[]).length} point(s)</p>
                      </div>
                      <StatusBadge status={order.status}/>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {(order.DeliveryPoints || []).map(pt => (
                        <div key={pt.id} className="px-5 py-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex gap-3">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {pt.sequence}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800">{pt.clientName}</p>
                                <p className="text-xs text-gray-400">{pt.address}</p>
                                {pt.pickupAddress && (
                                  <p className="text-xs text-orange-500 mt-0.5">
                                    📍 {pt.pickupAddress}
                                  </p>
                                )}
                                {(pt.items||[]).length > 0 && (
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {(pt.items||[]).map((item, i) => (
                                      <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                        {item.emoji} {item.name} ×{item.qty}
                                      </span>
                                    ))}
                                    {pt.totalPrice && (
                                      <span className="text-xs font-bold text-blue-600 ml-1">
                                        {pt.totalPrice} MAD
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={pt.status}/>
                          </div>

                          {pt.status !== 'delivered' && pt.status !== 'failed' && (
                            <div className="flex gap-2 ml-10 flex-wrap mt-2">
                              {[
                                { v: 'delivered', l: '✓ Livré',   c: 'bg-green-500 hover:bg-green-600 text-white' },
                                { v: 'failed',    l: '✗ Échec',   c: 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200' },
                              ].map(a => (
                                <button key={a.v}
                                  onClick={() => updateStatus(pt.id, a.v)}
                                  className={`text-xs px-4 py-2 rounded-lg font-bold transition ${a.c}`}>
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
            )
          )
        )}
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../api/api'

export default function DashboardPage() {
  const [orders,  setOrders]  = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/orders'), api.get('/drivers')])
      .then(([o, d]) => { setOrders(o.data); setDrivers(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const total      = orders.length
  const done       = orders.filter(o => o.status === 'done').length
  const inProgress = orders.filter(o => o.status === 'in_progress').length
  const rate       = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>

        {loading ? <LoadingSpinner /> : <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Tournées totales', value: total,      border: 'border-blue-400',   txt: 'text-blue-700' },
              { label: 'Terminées',        value: done,       border: 'border-green-400',  txt: 'text-green-700' },
              { label: 'En cours',         value: inProgress, border: 'border-yellow-400', txt: 'text-yellow-700' },
              { label: 'Taux de succès',   value: `${rate}%`, border: 'border-purple-400', txt: 'text-purple-700' },
            ].map(({ label, value, border, txt }) => (
              <div key={label} className={`bg-white rounded-2xl p-5 border-l-4 ${border} shadow-sm`}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-3xl font-bold ${txt}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-700 mb-4">Livreurs actifs</h2>
              {drivers.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun livreur enregistré</p>
              ) : (
                <div className="space-y-3">
                  {drivers.map(d => (
                    <div key={d.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                        {d.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.vehicle} · {d.phone}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-700 mb-4">Dernières tournées</h2>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune tournée créée</p>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{o.date}</p>
                        <p className="text-xs text-gray-400">{o.Driver?.name || '—'}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>}
      </div>
    </div>
  )
}
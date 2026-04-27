import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import api from '../../api/api'

export default function DashboardPage() {
  const [orders,  setOrders]  = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([api.get('/orders'), api.get('/drivers')])
      .then(([o, d]) => { setOrders(o.data); setDrivers(d.data) })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i) }, [])

  const total      = orders.length
  const done       = orders.filter(o => o.status === 'done').length
  const inProgress = orders.filter(o => o.status === 'in_progress').length
  const planned    = orders.filter(o => o.status === 'planned').length
  const waiting    = orders.filter(o => o.status === 'pending_acceptance').length
  const rate       = total ? Math.round((done / total) * 100) : 0
  const allPoints  = orders.flatMap(o => o.DeliveryPoints || [])
  const ptDel      = allPoints.filter(p => p.status === 'delivered').length
  const ptFail     = allPoints.filter(p => p.status === 'failed').length
  const ptPend     = allPoints.filter(p => p.status === 'pending').length

  const completedWithTime = orders.filter(o => o.status === 'done' && o.startedAt && o.finishedAt)
  const avgMin = completedWithTime.length > 0
    ? Math.round(completedWithTime.reduce((s, o) => s + (new Date(o.finishedAt) - new Date(o.startedAt)) / 60000, 0) / completedWithTime.length)
    : null
  const fmt = m => m === null ? '—' : m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60}min`

  const parseItems = raw => { try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || []) } catch { return [] } }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.pageTitle}>Tableau de bord</h1>
            <p style={s.pageSub}>Vue d'ensemble de votre activité</p>
          </div>
          <button onClick={load} style={s.refreshBtn}>↻ Actualiser</button>
        </div>

        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <span style={{ color: '#999', fontSize: 14 }}>Chargement…</span>
          </div>
        ) : (
          <>
            {/* KPI Tournées */}
            <div style={s.kpiGrid}>
              {[
                { label: 'Total commandes',  value: total,           color: '#1A1A18', bg: '#fff',     border: '#E5E7EB' },
                { label: 'En cours',         value: inProgress+planned, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                { label: 'Taux de succès',   value: `${rate}%`,      color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
                { label: 'Temps moyen',      value: fmt(avgMin),     color: F,         bg: '#FFFBEB', border: '#FDE68A' },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ ...s.kpiCard, background: bg, borderColor: border }}>
                  <p style={s.kpiLabel}>{label}</p>
                  <p style={{ ...s.kpiVal, color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* KPI Points */}
            <div style={s.pointsGrid}>
              {[
                { label: 'Points livrés',     value: ptDel,  color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
                { label: 'Points en attente', value: ptPend, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                { label: 'Points échoués',    value: ptFail, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ ...s.pointCard, background: bg, borderColor: border }}>
                  <p style={s.kpiLabel}>{label}</p>
                  <p style={{ ...s.pointVal, color }}>{value}</p>
                </div>
              ))}
            </div>

            <div style={s.twoCol}>
              {/* Livreurs */}
              <div style={s.card}>
                <h2 style={s.cardTitle}> Livreurs ({drivers.length})</h2>
                {drivers.length === 0 ? (
                  <p style={s.empty}>Aucun livreur enregistré</p>
                ) : drivers.map(d => {
                  const active = orders.filter(o => o.driverId === d.id && ['planned','in_progress'].includes(o.status)).length
                  return (
                    <div key={d.id} style={s.driverRow}>
                      <div style={s.avatar}>{d.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <p style={s.driverName}>{d.name}</p>
                        <p style={s.driverSub}>{d.vehicle} · {active > 0 ? `${active} en cours` : 'Disponible'}</p>
                      </div>
                      <div style={{ ...s.statusDot, background: d.status === 'active' ? '#22C55E' : '#9CA3AF' }} />
                    </div>
                  )
                })}
              </div>

              {/* Dernières commandes */}
              <div style={s.card}>
                <h2 style={s.cardTitle}> Dernières commandes</h2>
                {orders.length === 0 ? (
                  <p style={s.empty}>Aucune commande</p>
                ) : orders.slice(0, 6).map(o => {
                  const pts = o.DeliveryPoints || []
                  const items = parseItems(pts[0]?.items)
                  return (
                    <div key={o.id} style={s.orderRow}>
                      <div style={s.orderIcon}></div>
                      <div style={{ flex: 1 }}>
                        <p style={s.orderClient}>{pts[0]?.clientName || '—'}</p>
                        <p style={s.orderSub}>{o.Driver?.name || 'Non assigné'} · {o.date}</p>
                      </div>
                      <div style={s.orderRight}>
                        {pts[0]?.totalPrice > 0 && <span style={s.price}>{pts[0].totalPrice} MAD</span>}
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* En attente */}
            {waiting > 0 && (
              <div style={s.waitingCard}>
                <div style={s.waitingHeader}>
                  <div style={s.pulseDot} />
                  <h2 style={s.waitingTitle}>{waiting} commande{waiting > 1 ? 's' : ''} en attente d'un livreur</h2>
                </div>
                {orders.filter(o => o.status === 'pending_acceptance').map(o => {
                  const pts = o.DeliveryPoints || []
                  return (
                    <div key={o.id} style={s.waitingRow}>
                      <div>
                        <p style={s.waitingClient}>{pts[0]?.clientName || '—'}</p>
                        <p style={s.waitingAddr}>{pts[0]?.address || '—'}</p>
                      </div>
                      {pts[0]?.totalPrice > 0 && (
                        <span style={s.waitingPrice}>{pts[0].totalPrice} MAD</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const F = '#D97706'
const Y = '#F59E0B'

const s = {
  page:      { minHeight: '100vh', background: '#FAFAF8', fontFamily: 'system-ui, sans-serif' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  pageTitle: { fontSize: 26, fontWeight: 900, color: '#1A1A18', letterSpacing: -0.5 },
  pageSub:   { fontSize: 13, color: '#999', marginTop: 3 },
  refreshBtn:{ padding: '8px 18px', borderRadius: 10, border: `1.5px solid ${Y}`, background: '#FFFBEB', color: F, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  loadingBox:{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 80 },
  spinner:   { width: 24, height: 24, border: `3px solid ${Y}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  kpiGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 },
  kpiCard:   { borderRadius: 18, padding: '20px 22px', border: '1.5px solid', borderLeft: `4px solid ${Y}` },
  kpiLabel:  { fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  kpiVal:    { fontSize: 32, fontWeight: 900, letterSpacing: -1 },

  pointsGrid:{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 },
  pointCard: { borderRadius: 16, padding: '16px 20px', border: '1.5px solid' },
  pointVal:  { fontSize: 24, fontWeight: 800 },

  twoCol:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
  card:      { background: '#fff', borderRadius: 20, padding: '22px 24px', border: '1.5px solid #EBEBEB' },
  cardTitle: { fontSize: 15, fontWeight: 800, color: '#1A1A18', marginBottom: 18, letterSpacing: -0.3 },
  empty:     { fontSize: 13, color: '#CCC', textAlign: 'center', padding: '24px 0' },

  driverRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F5F3' },
  avatar:    { width: 36, height: 36, borderRadius: '50%', background: '#FFFBEB', border: `2px solid ${Y}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: F },
  driverName:{ fontSize: 14, fontWeight: 700, color: '#1A1A18' },
  driverSub: { fontSize: 12, color: '#999' },
  statusDot: { width: 9, height: 9, borderRadius: '50%' },

  orderRow:  { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F5F3' },
  orderIcon: { fontSize: 20 },
  orderClient:{ fontSize: 14, fontWeight: 700, color: '#1A1A18' },
  orderSub:  { fontSize: 12, color: '#999' },
  orderRight:{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  price:     { fontSize: 13, fontWeight: 800, color: F },

  waitingCard:  { background: '#FFFBEB', border: `1.5px solid #FDE68A`, borderRadius: 20, padding: '20px 24px' },
  waitingHeader:{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  pulseDot:     { width: 9, height: 9, borderRadius: '50%', background: Y },
  waitingTitle: { fontSize: 15, fontWeight: 800, color: '#92400E' },
  waitingRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 8, border: '1px solid #FDE68A' },
  waitingClient:{ fontSize: 14, fontWeight: 700, color: '#1A1A18' },
  waitingAddr:  { fontSize: 12, color: '#999' },
  waitingPrice: { fontSize: 15, fontWeight: 800, color: F },
}
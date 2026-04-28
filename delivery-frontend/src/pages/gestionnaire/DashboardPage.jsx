import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import api from '../../api/api'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  brand:    '#FF6B35',
  dark:     '#1A1A2E',
  bg:       '#F7F8FA',
  card:     '#FFFFFF',
  border:   '#EDEEF2',
  textPrimary:   '#1A1A2E',
  textSecondary: '#8A8FA8',
  textMuted:     '#B5B9CC',
  green:    '#00B14F',
  red:      '#EF4444',
  blue:     '#3B6EF7',
}

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

  useEffect(() => {
    load()
    const i = setInterval(load, 30000)
    return () => clearInterval(i)
  }, [])

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
  const fmt = m => m === null ? '—' : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min`

  const parseItems = raw => { try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || []) } catch { return [] } }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <p style={s.pageTag}>VUE D'ENSEMBLE</p>
            <h1 style={s.pageTitle}>Tableau de bord</h1>
          </div>
          <button onClick={load} style={s.refreshBtn}>Actualiser</button>
        </div>

        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinner} />
            <span style={{ color: C.textSecondary, fontSize: 14 }}>Chargement...</span>
          </div>
        ) : (
          <>
            {/* KPI Grid tournées */}
            <div style={s.kpiGrid}>
              {[
                { label: 'Total commandes',    value: total,             color: C.dark,  bg: C.card,            border: C.border,   accent: C.dark },
                { label: 'En cours',           value: inProgress+planned, color: C.blue, bg: '#EEF2FF',         border: '#C7D2FE',  accent: C.blue },
                { label: 'Taux de succes',     value: `${rate}%`,        color: C.green, bg: '#E8FBF0',         border: '#B3EED0',  accent: C.green },
                { label: 'Temps moyen',        value: fmt(avgMin),       color: C.brand, bg: '#FFF4EF',         border: '#FFD5C2',  accent: C.brand },
              ].map(({ label, value, color, bg, border, accent }) => (
                <div key={label} style={{ ...s.kpiCard, background: bg, borderColor: border }}>
                  <div style={{ ...s.kpiAccentBar, background: accent }} />
                  <p style={s.kpiLabel}>{label}</p>
                  <p style={{ ...s.kpiVal, color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* KPI Points */}
            <div style={s.pointsGrid}>
              {[
                { label: 'Points livres',     value: ptDel,  color: C.green, bg: '#E8FBF0', border: '#B3EED0' },
                { label: 'Points en attente', value: ptPend, color: C.blue,  bg: '#EEF2FF', border: '#C7D2FE' },
                { label: 'Points echoues',    value: ptFail, color: C.red,   bg: '#FEF2F2', border: '#FECACA' },
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
                <div style={s.cardHeader}>
                  <h2 style={s.cardTitle}>Livreurs</h2>
                  <span style={s.countBadge}>{drivers.length}</span>
                </div>
                {drivers.length === 0 ? (
                  <p style={s.empty}>Aucun livreur enregistre</p>
                ) : drivers.map(d => {
                  const active = orders.filter(o => o.driverId === d.id && ['planned', 'in_progress'].includes(o.status)).length
                  return (
                    <div key={d.id} style={s.driverRow}>
                      <div style={s.avatar}>{d.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <p style={s.driverName}>{d.name}</p>
                        <p style={s.driverSub}>{d.vehicle} · {active > 0 ? `${active} en cours` : 'Disponible'}</p>
                      </div>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: d.status === 'active' ? C.green : C.textMuted,
                      }} />
                    </div>
                  )
                })}
              </div>

              {/* Dernieres commandes */}
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <h2 style={s.cardTitle}>Dernieres commandes</h2>
                </div>
                {orders.length === 0 ? (
                  <p style={s.empty}>Aucune commande</p>
                ) : orders.slice(0, 6).map(o => {
                  const pts = o.DeliveryPoints || []
                  return (
                    <div key={o.id} style={s.orderRow}>
                      <div style={s.orderIcon} />
                      <div style={{ flex: 1 }}>
                        <p style={s.orderClient}>{pts[0]?.clientName || '—'}</p>
                        <p style={s.orderSub}>{o.Driver?.name || 'Non assigne'} · {o.date}</p>
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

            {/* Waiting orders */}
            {waiting > 0 && (
              <div style={s.waitingCard}>
                <div style={s.waitingHeader}>
                  <div style={s.pulseDot} />
                  <h2 style={s.waitingTitle}>
                    {waiting} commande{waiting > 1 ? 's' : ''} en attente d'un livreur
                  </h2>
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

const s = {
  page:      { minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },

  header:    { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 },
  pageTag:   { fontSize: 11, fontWeight: 800, color: C.brand, letterSpacing: 1.5, marginBottom: 4 },
  pageTitle: { fontSize: 26, fontWeight: 900, color: C.dark, letterSpacing: -0.5 },
  refreshBtn:{
    padding: '9px 18px', borderRadius: 11,
    border: `1.5px solid ${C.border}`, background: C.card,
    color: C.textSecondary, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },

  loadingBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 80 },
  spinner: {
    width: 24, height: 24,
    border: `3px solid ${C.border}`, borderTopColor: C.brand,
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },

  // KPI
  kpiGrid:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 },
  kpiCard:      { borderRadius: 18, padding: '22px 24px', border: '1.5px solid', position: 'relative', overflow: 'hidden' },
  kpiAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  kpiLabel:     { fontSize: 11, fontWeight: 700, color: C.textSecondary, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  kpiVal:       { fontSize: 32, fontWeight: 900, letterSpacing: -1 },

  pointsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 },
  pointCard:  { borderRadius: 16, padding: '18px 20px', border: '1.5px solid' },
  pointVal:   { fontSize: 26, fontWeight: 900, letterSpacing: -0.5 },

  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
  card:   { background: C.card, borderRadius: 20, padding: '22px 24px', border: `1.5px solid ${C.border}` },

  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 },
  cardTitle:  { fontSize: 15, fontWeight: 800, color: C.dark, letterSpacing: -0.3 },
  countBadge: {
    background: C.brand, color: '#fff',
    borderRadius: 8, padding: '2px 9px',
    fontSize: 11, fontWeight: 800,
  },
  empty: { fontSize: 13, color: C.textMuted, textAlign: 'center', padding: '24px 0' },

  driverRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.border}` },
  avatar:    {
    width: 36, height: 36, borderRadius: '50%',
    background: '#FFF4EF', border: `2px solid ${C.brand}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 800, color: C.brand, flexShrink: 0,
  },
  driverName: { fontSize: 14, fontWeight: 700, color: C.dark },
  driverSub:  { fontSize: 12, color: C.textSecondary, marginTop: 2 },

  orderRow:    { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.border}` },
  orderIcon:   { width: 34, height: 34, borderRadius: 10, background: '#FFF4EF', border: `1px solid #FFD5C2`, flexShrink: 0 },
  orderClient: { fontSize: 14, fontWeight: 700, color: C.dark },
  orderSub:    { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  orderRight:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 },
  price:       { fontSize: 13, fontWeight: 800, color: C.brand },

  waitingCard: {
    background: '#FFF4EF', border: `1.5px solid #FFD5C2`,
    borderRadius: 20, padding: '20px 24px',
  },
  waitingHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  pulseDot:      { width: 9, height: 9, borderRadius: '50%', background: C.brand },
  waitingTitle:  { fontSize: 15, fontWeight: 800, color: '#B34000' },
  waitingRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: C.card, borderRadius: 13, padding: '13px 16px',
    marginBottom: 8, border: `1px solid #FFD5C2`,
  },
  waitingClient: { fontSize: 14, fontWeight: 700, color: C.dark },
  waitingAddr:   { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  waitingPrice:  { fontSize: 16, fontWeight: 900, color: C.brand },
}
/**
 * LiveMapPage.jsx — Carte live redesignée
 * Palette : #F59E0B jaune · #D97706 jaune foncé · #1A1A18 charbon · #FFFBEB fond clair · #FAFAF8 background
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/api'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  yellow:      '#F59E0B',
  yellowDark:  '#D97706',
  yellowLight: '#FEF3C7',
  yellowBg:    '#FFFBEB',
  black:       '#1A1A18',
  blackSoft:   '#2D2D2A',
  gray:        '#6B7280',
  grayLight:   '#F3F3F0',
  bg:          '#FAFAF8',
  white:       '#FFFFFF',
  border:      '#E8E6DF',
  green:       '#16A34A',
  greenBg:     '#F0FDF4',
  greenBorder: '#BBF7D0',
  red:         '#DC2626',
  redBg:       '#FEF2F2',
  blue:        '#2563EB',
  blueBg:      '#EFF6FF',
}

const STATUS_COLOR = {
  pending:     C.yellow,
  in_progress: C.blue,
  delivered:   C.green,
  failed:      C.red,
  planned:     '#9CA3AF',
  done:        C.green,
}

const STATUS_LABEL = {
  pending:     'En attente',
  in_progress: 'En cours',
  delivered:   'Livré',
  failed:      'Échec',
  planned:     'Planifié',
  done:        'Terminé',
}

const DRIVER_COLORS = [
  C.yellow, C.blue, C.green, C.red, '#7C3AED',
  '#0891B2', '#BE185D', '#059669', '#EA580C', '#4F46E5',
]

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return `Il y a ${diff}s`
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  return `Il y a ${Math.floor(diff / 3600)}h`
}

function makeDriverIcon(L, color, label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="20" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="22" y="27" text-anchor="middle" fill="white" font-size="13" font-weight="700" font-family="sans-serif">${label}</text>
    </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  })
}

function makePointIcon(L, color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  })
}

export default function LiveMapPage() {
  const mapRef         = useRef(null)
  const leafletMapRef  = useRef(null)
  const driverLayerRef = useRef({})
  const pointLayersRef = useRef([])
  const intervalRef    = useRef(null)
  const leafletRef     = useRef(null)

  const [drivers,    setDrivers]    = useState([])
  const [orders,     setOrders]     = useState([])
  const [selected,   setSelected]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error,      setError]      = useState(null)

  // ── Charger Leaflet dynamiquement ─────────────────────────────────────────
  useEffect(() => {
    if (leafletRef.current) return
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => { leafletRef.current = window.L; initMap() }
    document.head.appendChild(script)

    return () => {
      try { document.head.removeChild(link) } catch {}
      try { document.head.removeChild(script) } catch {}
    }
  }, [])

  const initMap = () => {
    const L = window.L
    if (!L || !mapRef.current || leafletMapRef.current) return
    leafletMapRef.current = L.map(mapRef.current, {
      center: [31.6295, -7.9811],
      zoom: 13,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(leafletMapRef.current)
  }

  const updateMarkers = useCallback((gpsData, ordersData) => {
    const L   = leafletRef.current
    const map = leafletMapRef.current
    if (!L || !map) return

    pointLayersRef.current.forEach(m => map.removeLayer(m))
    pointLayersRef.current = []

    gpsData.forEach((d, idx) => {
      const lat = parseFloat(d.latitude)
      const lng = parseFloat(d.longitude)
      if (isNaN(lat) || isNaN(lng)) return
      const color = DRIVER_COLORS[idx % DRIVER_COLORS.length]
      const icon  = makeDriverIcon(L, color, initials(d.driverName || ''))

      if (driverLayerRef.current[d.driverId]) {
        driverLayerRef.current[d.driverId].setLatLng([lat, lng])
      } else {
        const marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:150px;padding:4px">
              <div style="font-weight:700;font-size:14px;color:#1A1A18;margin-bottom:4px">${d.driverName || 'Livreur'}</div>
              <div style="font-size:12px;color:#6B7280">${d.vehicle || 'Moto'}</div>
              <div style="font-size:11px;color:#9CA3AF;margin-top:4px">${timeAgo(d.updatedAt)}</div>
            </div>
          `)
        marker.on('click', () => setSelected(d.driverId))
        driverLayerRef.current[d.driverId] = marker
      }
    })

    ordersData.forEach(order => {
      const points = order.DeliveryPoints || []
      points.forEach(pt => {
        const lat = parseFloat(pt.lat || pt.latitude)
        const lng = parseFloat(pt.lng || pt.longitude)
        if (isNaN(lat) || isNaN(lng)) return
        const color = STATUS_COLOR[pt.status] || '#9CA3AF'
        const icon  = makePointIcon(L, color)
        const m = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px;padding:4px">
              <div style="font-weight:700;font-size:14px;color:#1A1A18;margin-bottom:4px">${pt.clientName || '—'}</div>
              <div style="font-size:12px;color:#6B7280;margin-bottom:6px">${pt.address || '—'}</div>
              <span style="background:${color};color:#fff;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600">
                ${STATUS_LABEL[pt.status] || pt.status}
              </span>
              ${pt.failureNote ? `<div style="font-size:11px;color:#DC2626;margin-top:6px">⚠️ ${pt.failureNote}</div>` : ''}
            </div>
          `)
        pointLayersRef.current.push(m)
      })
    })
  }, [])

  const loadData = useCallback(async (silent = false) => {
    try {
      const [gpsRes, ordersRes] = await Promise.all([
        api.get('/tracking/live'),
        api.get('/orders?status=in_progress'),
      ])
      const gpsData    = gpsRes.data    || []
      const ordersData = ordersRes.data || []
      setDrivers(gpsData)
      setOrders(ordersData)
      setLastUpdate(new Date())
      setError(null)
      updateMarkers(gpsData, ordersData)
    } catch (err) {
      if (!silent) setError('Impossible de charger les données GPS.')
    } finally {
      setLoading(false)
    }
  }, [updateMarkers])

  useEffect(() => {
    const wait = setInterval(() => {
      if (leafletRef.current && leafletMapRef.current) {
        clearInterval(wait)
        loadData()
        intervalRef.current = setInterval(() => loadData(true), 10000)
      }
    }, 200)
    return () => { clearInterval(wait); clearInterval(intervalRef.current) }
  }, [loadData])

  useEffect(() => {
    if (!selected) return
    const d = drivers.find(x => x.driverId === selected)
    if (!d || !leafletMapRef.current) return
    leafletMapRef.current.setView([parseFloat(d.latitude), parseFloat(d.longitude)], 16, { animate: true })
    driverLayerRef.current[selected]?.openPopup()
  }, [selected, drivers])

  const allPoints  = orders.flatMap(o => o.DeliveryPoints || [])
  const delivered  = allPoints.filter(p => p.status === 'delivered').length
  const inProgress = allPoints.filter(p => p.status === 'in_progress').length
  const failed     = allPoints.filter(p => p.status === 'failed').length

  const selectedDriver = drivers.find(d => d.driverId === selected)
  const selectedOrders = orders.filter(o =>
    String(o.driverId) === String(selected) || String(o.driver_id) === String(selected)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Panel gauche ──────────────────────────────────────────────── */}
        <div style={{
          width: 320, background: C.white, borderRight: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
        }}>

          {/* Header */}
          <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}`, background: C.black }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.white, letterSpacing: '-0.3px' }}>
                  🗺 Carte live
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  Suivi en temps réel
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(245,158,11,0.15)', border: `1px solid rgba(245,158,11,0.3)`,
                borderRadius: 20, padding: '5px 10px',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.yellow, boxShadow: `0 0 6px ${C.yellow}` }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: C.yellow }}>
                  {lastUpdate ? lastUpdate.toLocaleTimeString('fr-FR') : '—'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[
                { label: 'Livreurs', value: drivers.length, color: C.yellow,  bg: 'rgba(245,158,11,0.15)' },
                { label: 'Livrés',   value: delivered,      color: '#4ADE80',  bg: 'rgba(74,222,128,0.15)' },
                { label: 'En cours', value: inProgress,     color: '#60A5FA',  bg: 'rgba(96,165,250,0.15)' },
                { label: 'Échecs',   value: failed,         color: '#F87171',  bg: 'rgba(248,113,113,0.15)' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: 600, letterSpacing: '0.3px' }}>
                    {s.label.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section titre livreurs */}
          <div style={{ padding: '12px 20px 8px', borderBottom: `1px solid ${C.border}`, background: C.yellowBg }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.yellowDark, letterSpacing: 1 }}>
              LIVREURS ACTIFS
            </span>
          </div>

          {/* Liste livreurs */}
          <div style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.gray }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                <div style={{ fontSize: 13 }}>Chargement...</div>
              </div>
            ) : error ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                <div style={{ fontSize: 13, color: C.red, marginBottom: 12 }}>{error}</div>
                <button onClick={() => loadData()} style={{
                  background: C.yellow, color: C.black, border: 'none',
                  borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 700,
                }}>
                  Réessayer
                </button>
              </div>
            ) : drivers.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.gray }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.black, marginBottom: 6 }}>
                  Aucun livreur actif
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.7 }}>
                  Les livreurs apparaissent ici quand ils activent le GPS dans l'app mobile
                </div>
              </div>
            ) : (
              drivers.map((d, idx) => {
                const color      = DRIVER_COLORS[idx % DRIVER_COLORS.length]
                const isSelected = selected === d.driverId
                const dOrders    = orders.filter(o =>
                  String(o.driverId) === String(d.driverId) || String(o.driver_id) === String(d.driverId)
                )
                const dPoints = dOrders.flatMap(o => o.DeliveryPoints || [])
                const dDone   = dPoints.filter(p => p.status === 'delivered').length
                const pct     = dPoints.length ? Math.round((dDone / dPoints.length) * 100) : 0

                return (
                  <div key={d.driverId}
                    onClick={() => setSelected(isSelected ? null : d.driverId)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: `1px solid ${C.border}`,
                      cursor: 'pointer',
                      background: isSelected ? C.yellowBg : C.white,
                      borderLeft: `4px solid ${isSelected ? C.yellow : 'transparent'}`,
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: isSelected ? C.yellow : C.black,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: isSelected ? C.black : C.yellow,
                        flexShrink: 0, transition: 'all .15s',
                        boxShadow: isSelected ? `0 0 0 3px ${C.yellowLight}` : 'none',
                      }}>
                        {initials(d.driverName || '')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.black }}>{d.driverName || 'Livreur'}</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
                          {d.vehicle || 'Moto'} · {dDone}/{dPoints.length} pts livrés
                        </div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{timeAgo(d.updatedAt)}</div>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                        borderRadius: 10, padding: '3px 8px',
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.green }}>Actif</span>
                      </div>
                    </div>

                    {dPoints.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 10, color: C.gray, fontWeight: 600 }}>Progression</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: isSelected ? C.yellowDark : C.black }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ height: 5, background: C.grayLight, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${C.yellow}, ${C.yellowDark})`,
                            borderRadius: 3,
                            transition: 'width .4s ease',
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Légende */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, background: C.white }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.gray, marginBottom: 8, letterSpacing: 1 }}>
              STATUTS POINTS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[k] }} />
                  <span style={{ fontSize: 10, color: C.gray, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Zone carte ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* Loading overlay */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(250,250,248,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000,
            }}>
              <div style={{ textAlign: 'center', color: C.gray }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.black }}>Chargement de la carte...</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 6 }}>Connexion à OpenStreetMap</div>
              </div>
            </div>
          )}

          {/* Panel livreur sélectionné */}
          {selected && selectedDriver && (
            <div style={{
              position: 'absolute', top: 16, right: 16, width: 300,
              background: C.white, borderRadius: 18,
              boxShadow: '0 8px 40px rgba(26,26,24,0.15)',
              zIndex: 1000, maxHeight: 'calc(100% - 32px)',
              display: 'flex', flexDirection: 'column',
              border: `1px solid ${C.border}`,
              overflow: 'hidden',
            }}>
              {/* En-tête panel */}
              <div style={{
                padding: '18px 20px',
                background: C.black,
                borderBottom: `3px solid ${C.yellow}`,
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: C.yellow,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 800, color: C.black,
                    }}>
                      {initials(selectedDriver.driverName || '')}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>
                        {selectedDriver.driverName || 'Livreur'}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                        {selectedDriver.vehicle || 'Moto'} · {timeAgo(selectedDriver.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{
                    background: 'rgba(245,158,11,0.2)', border: `1px solid rgba(245,158,11,0.3)`,
                    borderRadius: 8, color: C.yellow, cursor: 'pointer',
                    padding: '5px 10px', fontSize: 14, fontWeight: 700,
                  }}>✕</button>
                </div>
              </div>

              {/* Corps panel */}
              <div style={{ overflowY: 'auto', padding: '16px 20px', background: C.bg }}>
                {selectedOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', color: C.gray, fontSize: 13, padding: '20px 0' }}>
                    Aucune tournée active
                  </div>
                ) : selectedOrders.map(order => {
                  const pts = order.DeliveryPoints || []
                  return (
                    <div key={order.id} style={{ marginBottom: 16 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 800, color: C.yellowDark,
                        letterSpacing: 0.5, marginBottom: 10,
                        paddingBottom: 6, borderBottom: `1px solid ${C.border}`,
                      }}>
                        TOURNÉE — {order.date || new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                      {pts.map((pt, i) => (
                        <div key={pt.id || i} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 12px', marginBottom: 6,
                          background: C.white, borderRadius: 12,
                          border: `1px solid ${C.border}`,
                        }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: 8,
                            background: STATUS_COLOR[pt.status] || '#9CA3AF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800, color: '#fff',
                            flexShrink: 0, marginTop: 1,
                          }}>
                            {pt.sequence || i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.black }}>
                              {pt.clientName || '—'}
                            </div>
                            <div style={{
                              fontSize: 11, color: C.gray, marginTop: 2,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {pt.address || '—'}
                            </div>
                            {pt.failureNote && (
                              <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}> {pt.failureNote}</div>
                            )}
                          </div>
                          <span style={{
                            background: (STATUS_COLOR[pt.status] || '#9CA3AF') + '22',
                            color: STATUS_COLOR[pt.status] || '#9CA3AF',
                            borderRadius: 8, padding: '3px 8px',
                            fontSize: 10, fontWeight: 700, flexShrink: 0,
                            border: `1px solid ${(STATUS_COLOR[pt.status] || '#9CA3AF')}44`,
                          }}>
                            {STATUS_LABEL[pt.status] || pt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bouton refresh */}
          <button onClick={() => loadData()} style={{
            position: 'absolute', bottom: 24, right: 24,
            background: C.yellow, border: 'none',
            borderRadius: 12, padding: '11px 20px',
            fontSize: 13, fontWeight: 800, color: C.black,
            cursor: 'pointer',
            boxShadow: `0 4px 20px rgba(245,158,11,0.4)`,
            display: 'flex', alignItems: 'center', gap: 8,
            zIndex: 1000, transition: 'transform .1s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ↻ Actualiser
          </button>

          {/* Badge drivers count */}
          {drivers.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 24, left: 24,
              background: C.black, borderRadius: 12,
              padding: '10px 16px', zIndex: 1000,
              display: 'flex', alignItems: 'center', gap: 10,
              border: `1px solid rgba(245,158,11,0.3)`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.yellow, boxShadow: `0 0 8px ${C.yellow}` }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>
                {drivers.length} livreur{drivers.length > 1 ? 's' : ''} en ligne
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
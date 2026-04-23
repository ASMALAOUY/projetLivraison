/**
 * LiveMapPage.jsx — Carte live avec Leaflet (OpenStreetMap, sans clé API)
 * npm install leaflet
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/api'

const STATUS_COLOR = {
  pending:     '#F59E0B',
  in_progress: '#3B82F6',
  delivered:   '#22C55E',
  failed:      '#EF4444',
  planned:     '#9CA3AF',
  done:        '#22C55E',
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
  '#2563EB','#DC2626','#16A34A','#D97706','#7C3AED',
  '#0891B2','#BE185D','#059669','#EA580C','#4F46E5',
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

// Créer une icône SVG circulaire pour le livreur
function makeDriverIcon(L, color, label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="20" y="25" text-anchor="middle" fill="white" font-size="13" font-weight="700" font-family="sans-serif">${label}</text>
    </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  })
}

// Créer une icône pin pour les points de livraison
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
  const mapRef        = useRef(null)
  const leafletMapRef = useRef(null)
  const driverLayerRef = useRef({})   // driverId → marker
  const pointLayersRef = useRef([])   // markers points
  const intervalRef   = useRef(null)
  const leafletRef    = useRef(null)

  const [drivers,    setDrivers]    = useState([])
  const [orders,     setOrders]     = useState([])
  const [selected,   setSelected]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error,      setError]      = useState(null)

  // ── Charger Leaflet dynamiquement ───────────────────────────────────────────
  useEffect(() => {
    if (leafletRef.current) return

    // CSS Leaflet
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    // JS Leaflet
    const script = document.createElement('script')
    script.src   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => {
      leafletRef.current = window.L
      initMap()
    }
    document.head.appendChild(script)

    return () => {
      try { document.head.removeChild(link) } catch {}
      try { document.head.removeChild(script) } catch {}
    }
  }, [])

  // ── Initialiser la carte Leaflet ────────────────────────────────────────────
  const initMap = () => {
    const L = window.L
    if (!L || !mapRef.current || leafletMapRef.current) return

    leafletMapRef.current = L.map(mapRef.current, {
      center: [31.6295, -7.9811], // Marrakech
      zoom: 13,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(leafletMapRef.current)
  }

  // ── Mettre à jour les markers ───────────────────────────────────────────────
  const updateMarkers = useCallback((gpsData, ordersData) => {
    const L   = leafletRef.current
    const map = leafletMapRef.current
    if (!L || !map) return

    // Supprimer anciens markers points
    pointLayersRef.current.forEach(m => map.removeLayer(m))
    pointLayersRef.current = []

    // Markers livreurs
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
            <div style="font-family:sans-serif;min-width:150px">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">${d.driverName || 'Livreur'}</div>
              <div style="font-size:12px;color:#555">${d.vehicle || 'Moto'}</div>
              <div style="font-size:11px;color:#999;margin-top:4px">${timeAgo(d.updatedAt)}</div>
            </div>
          `)
        marker.on('click', () => setSelected(d.driverId))
        driverLayerRef.current[d.driverId] = marker
      }
    })

    // Markers points de livraison
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
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">${pt.clientName || '—'}</div>
              <div style="font-size:12px;color:#555;margin-bottom:6px">${pt.address || '—'}</div>
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

  // ── Charger données GPS + tournées ──────────────────────────────────────────
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
    // Attendre que Leaflet soit chargé avant le premier loadData
    const wait = setInterval(() => {
      if (leafletRef.current && leafletMapRef.current) {
        clearInterval(wait)
        loadData()
        intervalRef.current = setInterval(() => loadData(true), 10000)
      }
    }, 200)
    return () => {
      clearInterval(wait)
      clearInterval(intervalRef.current)
    }
  }, [loadData])

  // ── Centrer sur livreur sélectionné ────────────────────────────────────────
  useEffect(() => {
    if (!selected) return
    const d = drivers.find(x => x.driverId === selected)
    if (!d || !leafletMapRef.current) return
    leafletMapRef.current.setView(
      [parseFloat(d.latitude), parseFloat(d.longitude)], 16,
      { animate: true }
    )
    driverLayerRef.current[selected]?.openPopup()
  }, [selected, drivers])

  // ── Stats ───────────────────────────────────────────────────────────────────
  const allPoints  = orders.flatMap(o => o.DeliveryPoints || [])
  const delivered  = allPoints.filter(p => p.status === 'delivered').length
  const inProgress = allPoints.filter(p => p.status === 'in_progress').length
  const failed     = allPoints.filter(p => p.status === 'failed').length

  const selectedDriver = drivers.find(d => d.driverId === selected)
  const selectedOrders = orders.filter(o =>
    String(o.driverId) === String(selected) || String(o.driver_id) === String(selected)
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'sans-serif' }}>
      <Navbar />

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── Panel gauche ─────────────────────────────────────────────── */}
        <div style={{ width:320, background:'#fff', borderRight:'1px solid #E5E7EB', display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>

          {/* Header */}
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #F3F4F6' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'#111827' }}>🗺 Carte live</h2>
              <div style={{ display:'flex', alignItems:'center', gap:6, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:20, padding:'4px 10px' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E' }}/>
                <span style={{ fontSize:11, fontWeight:600, color:'#16A34A' }}>
                  {lastUpdate ? lastUpdate.toLocaleTimeString('fr-FR') : 'Chargement...'}
                </span>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
              {[
                { label:'Livreurs', value:drivers.length, color:'#2563EB', bg:'#EFF6FF' },
                { label:'Livrés',   value:delivered,      color:'#16A34A', bg:'#F0FDF4' },
                { label:'En cours', value:inProgress,     color:'#2563EB', bg:'#EFF6FF' },
                { label:'Échecs',   value:failed,         color:'#DC2626', bg:'#FEF2F2' },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10, color:'#6B7280', marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Liste livreurs */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? (
              <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
                <div style={{ fontSize:13 }}>Chargement...</div>
              </div>
            ) : error ? (
              <div style={{ padding:24, textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>⚠️</div>
                <div style={{ fontSize:13, color:'#DC2626', marginBottom:12 }}>{error}</div>
                <button onClick={() => loadData()}
                  style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, cursor:'pointer', fontWeight:600 }}>
                  Réessayer
                </button>
              </div>
            ) : drivers.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
                <div style={{ fontSize:40, marginBottom:8 }}>🛵</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#374151' }}>Aucun livreur actif</div>
                <div style={{ fontSize:12, marginTop:6, lineHeight:1.7 }}>
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

                return (
                  <div key={d.driverId}
                    onClick={() => setSelected(isSelected ? null : d.driverId)}
                    style={{
                      padding:'14px 20px',
                      borderBottom:'1px solid #F9FAFB',
                      cursor:'pointer',
                      background: isSelected ? '#EFF6FF' : 'transparent',
                      borderLeft: `3px solid ${isSelected ? color : 'transparent'}`,
                      transition:'background .15s',
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                        {initials(d.driverName || '')}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{d.driverName || 'Livreur'}</div>
                        <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>
                          {d.vehicle || 'Moto'} · {dDone}/{dPoints.length} pts livrés
                        </div>
                        <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>{timeAgo(d.updatedAt)}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'3px 8px' }}>
                        <div style={{ width:5, height:5, borderRadius:'50%', background:'#22C55E' }}/>
                        <span style={{ fontSize:10, fontWeight:600, color:'#16A34A' }}>Actif</span>
                      </div>
                    </div>

                    {dPoints.length > 0 && (
                      <div style={{ marginTop:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:10, color:'#9CA3AF' }}>Progression</span>
                          <span style={{ fontSize:10, fontWeight:600, color:'#374151' }}>
                            {Math.round((dDone / dPoints.length) * 100)}%
                          </span>
                        </div>
                        <div style={{ height:4, background:'#E5E7EB', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${(dDone/dPoints.length)*100}%`, background:color, borderRadius:2, transition:'width .4s' }}/>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Légende */}
          <div style={{ padding:'12px 20px', borderTop:'1px solid #F3F4F6', background:'#F9FAFB' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', marginBottom:6, letterSpacing:.5 }}>STATUTS POINTS</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <div key={k} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COLOR[k] }}/>
                  <span style={{ fontSize:10, color:'#6B7280' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Zone carte ────────────────────────────────────────────────── */}
        <div style={{ flex:1, position:'relative' }}>
          <div ref={mapRef} style={{ width:'100%', height:'100%' }}/>

          {/* Loading overlay */}
          {loading && (
            <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
              <div style={{ textAlign:'center', color:'#6B7280' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>🗺️</div>
                <div style={{ fontSize:15, fontWeight:600 }}>Chargement de la carte...</div>
              </div>
            </div>
          )}

          {/* Panel livreur sélectionné */}
          {selected && selectedDriver && (
            <div style={{
              position:'absolute', top:16, right:16, width:300,
              background:'#fff', borderRadius:16,
              boxShadow:'0 8px 32px rgba(0,0,0,.14)',
              zIndex:1000, maxHeight:'calc(100% - 32px)',
              display:'flex', flexDirection:'column',
            }}>
              <div style={{ padding:'16px 20px', background:'#1E3A5F', borderRadius:'16px 16px 0 0', color:'#fff', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{selectedDriver.driverName || 'Livreur'}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginTop:3 }}>
                      {selectedDriver.vehicle || 'Moto'} · {timeAgo(selectedDriver.updatedAt)}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)}
                    style={{ background:'rgba(255,255,255,.2)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', padding:'5px 10px', fontSize:14 }}>
                    ✕
                  </button>
                </div>
              </div>

              <div style={{ overflowY:'auto', padding:'16px 20px' }}>
                {selectedOrders.length === 0 ? (
                  <div style={{ textAlign:'center', color:'#9CA3AF', fontSize:13, padding:'20px 0' }}>Aucune tournée active</div>
                ) : selectedOrders.map(order => {
                  const pts = order.DeliveryPoints || []
                  return (
                    <div key={order.id} style={{ marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:8 }}>
                        Tournée — {order.date || new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                      {pts.map((pt, i) => (
                        <div key={pt.id || i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:'1px solid #F9FAFB' }}>
                          <div style={{ width:22, height:22, borderRadius:6, background:STATUS_COLOR[pt.status]||'#9CA3AF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', flexShrink:0, marginTop:1 }}>
                            {pt.sequence || i+1}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{pt.clientName || '—'}</div>
                            <div style={{ fontSize:11, color:'#6B7280', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pt.address || '—'}</div>
                            {pt.failureNote && <div style={{ fontSize:11, color:'#DC2626', marginTop:2 }}>⚠️ {pt.failureNote}</div>}
                          </div>
                          <span style={{ background:(STATUS_COLOR[pt.status]||'#9CA3AF')+'22', color:STATUS_COLOR[pt.status]||'#9CA3AF', borderRadius:8, padding:'2px 8px', fontSize:10, fontWeight:700, flexShrink:0 }}>
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
          <button onClick={() => loadData()}
            style={{ position:'absolute', bottom:24, right:24, background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'10px 18px', fontSize:13, fontWeight:600, color:'#374151', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,.1)', display:'flex', alignItems:'center', gap:8, zIndex:1000 }}>
            ↻ Actualiser
          </button>
        </div>
      </div>
    </div>
  )
}
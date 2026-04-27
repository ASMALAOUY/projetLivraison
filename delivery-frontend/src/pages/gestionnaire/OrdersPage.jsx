import React, { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
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
  red:         '#DC2626',
  redBg:       '#FEF2F2',
}

export default function OrdersPage() {
  const [orders,   setOrders]   = useState([])
  const [drivers,  setDrivers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState({ driverId: '', date: '' })
  const [points,   setPoints]   = useState([])
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)

  const [showAddPoint, setShowAddPoint] = useState(false)
  const [addingPoint,  setAddingPoint]  = useState(false)
  const [pointForm,    setPointForm]    = useState({ clientName: '', address: '', phone: '', note: '' })
  const [pointError,   setPointError]   = useState('')
  const [pointSuccess, setPointSuccess] = useState('')

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/orders')
      setOrders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    api.get('/drivers').then(r => setDrivers(r.data)).catch(() => {})
  }, [])

  const createOrder = async () => {
    if (!form.driverId || !form.date) return
    setCreating(true)
    try {
      await api.post('/orders', form)
      setForm({ driverId: '', date: '' })
      await loadOrders()
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const viewPoints = async (orderId) => {
    if (selected === orderId) {
      setSelected(null); setPoints([])
      setShowAddPoint(false); setPointError(''); setPointSuccess('')
      return
    }
    setSelected(orderId)
    setShowAddPoint(false)
    const { data } = await api.get(`/points/order/${orderId}`)
    setPoints(data)
  }

  const handleAddPoint = async (e) => {
    e.preventDefault()
    setPointError(''); setPointSuccess('')
    if (!pointForm.clientName.trim() || !pointForm.address.trim()) {
      setPointError('Nom du client et adresse sont obligatoires')
      return
    }
    setAddingPoint(true)
    try {
      await api.post('/points', {
        orderId:     selected,
        clientName:  pointForm.clientName,
        address:     pointForm.address,
        latitude:    31.6295,
        longitude:   -7.9811,
        sequence:    points.length + 1,
        failureNote: pointForm.note || null,
      })
      setPointSuccess(`Point n°${points.length + 1} ajouté avec succès !`)
      setPointForm({ clientName: '', address: '', phone: '', note: '' })
      const { data } = await api.get(`/points/order/${selected}`)
      setPoints(data)
      setTimeout(() => setPointSuccess(''), 3000)
    } catch (err) {
      setPointError(err.response?.data?.error || "Erreur lors de l'ajout")
    } finally {
      setAddingPoint(false)
    }
  }

  const inputStyle = {
    width: '100%', border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '10px 14px', fontSize: 13, color: C.black, background: C.white,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 700,
    color: C.gray, marginBottom: 6, letterSpacing: '0.5px',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>

        {/* ── Titre page ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.yellowDark, letterSpacing: 1, marginBottom: 4 }}>
              MANAGEMENT
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.black, letterSpacing: '-0.5px' }}>
              Gestion des tournées
            </h1>
          </div>
          <div style={{
            marginLeft: 'auto', background: C.yellowBg, border: `1px solid ${C.yellowLight}`,
            borderRadius: 10, padding: '6px 14px',
            fontSize: 12, fontWeight: 700, color: C.yellowDark,
          }}>
            {orders.length} tournée{orders.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ── Formulaire nouvelle tournée ──────────────────────────────── */}
        <div style={{
          background: C.white, borderRadius: 18,
          border: `1px solid ${C.border}`,
          padding: 24, marginBottom: 20,
          boxShadow: '0 2px 12px rgba(26,26,24,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: C.yellow, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16,
            }}>📦</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.black }}>Nouvelle tournée</div>
              <div style={{ fontSize: 11, color: C.gray }}>Assigner un livreur à une date</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>LIVREUR</label>
              <select
                value={form.driverId}
                onChange={e => setForm({ ...form, driverId: e.target.value })}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">Choisir un livreur…</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.vehicle}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>DATE</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                style={{ ...inputStyle, width: 'auto' }}
              />
            </div>

            <button
              onClick={createOrder}
              disabled={!form.driverId || !form.date || creating}
              style={{
                background: (!form.driverId || !form.date || creating) ? C.grayLight : C.yellow,
                color:      (!form.driverId || !form.date || creating) ? C.gray : C.black,
                border: 'none', borderRadius: 10, padding: '10px 20px',
                fontSize: 13, fontWeight: 800, cursor: creating ? 'not-allowed' : 'pointer',
                transition: 'all .15s', whiteSpace: 'nowrap',
                boxShadow: (!form.driverId || !form.date || creating) ? 'none' : `0 4px 16px rgba(245,158,11,0.3)`,
              }}
            >
              {creating ? 'Création…' : '+ Créer la tournée'}
            </button>
          </div>

          {drivers.length === 0 && (
            <div style={{
              marginTop: 14, fontSize: 12, color: C.yellowDark,
              background: C.yellowBg, border: `1px solid ${C.yellowLight}`,
              borderRadius: 8, padding: '8px 12px',
            }}>
              ⚠️ Aucun livreur trouvé — créez d'abord un compte livreur dans la section Équipe
            </div>
          )}
        </div>

        {/* ── Table des tournées ───────────────────────────────────────── */}
        <div style={{
          background: C.white, borderRadius: 18,
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(26,26,24,0.04)',
        }}>
          {loading ? (
            <div style={{ padding: 40 }}><LoadingSpinner /></div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: C.gray }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.black, marginBottom: 6 }}>
                Aucune tournée créée
              </div>
              <div style={{ fontSize: 13 }}>Utilisez le formulaire ci-dessus pour commencer</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.black }}>
                  {['Date', 'Livreur', 'Véhicule', 'Points', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: 'left',
                      fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)',
                      letterSpacing: 1,
                    }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <React.Fragment key={o.id}>
                    <tr style={{
                      background: selected === o.id ? C.yellowBg : idx % 2 === 0 ? C.white : C.bg,
                      borderBottom: `1px solid ${C.border}`,
                      transition: 'background .1s',
                    }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: C.black }}>{o.date}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: C.black, color: C.yellow,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, flexShrink: 0,
                          }}>
                            {(o.Driver?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ color: C.black, fontWeight: 600 }}>{o.Driver?.name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', color: C.gray }}>{o.Driver?.vehicle || '—'}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          background: C.yellowBg, color: C.yellowDark,
                          border: `1px solid ${C.yellowLight}`,
                          borderRadius: 8, padding: '3px 10px',
                          fontSize: 12, fontWeight: 700,
                        }}>
                          {o.DeliveryPoints?.length ?? 0} pt{(o.DeliveryPoints?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}><StatusBadge status={o.status} /></td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => viewPoints(o.id)}
                          style={{
                            background: selected === o.id ? C.yellow : 'transparent',
                            color:      selected === o.id ? C.black : C.yellowDark,
                            border:     `1px solid ${selected === o.id ? C.yellow : C.yellowLight}`,
                            borderRadius: 8, padding: '5px 12px',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            transition: 'all .15s',
                          }}
                        >
                          {selected === o.id ? '▲ Masquer' : '▼ Voir points'}
                        </button>
                      </td>
                    </tr>

                    {/* ── Panneau points ───────────────────────────────── */}
                    {selected === o.id && (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px 24px', background: C.yellowBg, borderBottom: `1px solid ${C.border}` }}>

                          {/* Liste points existants */}
                          {points.length === 0 ? (
                            <div style={{
                              textAlign: 'center', padding: '16px', marginBottom: 16,
                              color: C.gray, fontSize: 13,
                              background: C.white, borderRadius: 12,
                              border: `1px dashed ${C.border}`,
                            }}>
                              Aucun point — ajoutez-en ci-dessous
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                              {points.map(p => {
                                let items = p.items || []
                                if (typeof items === 'string') {
                                  try { items = JSON.parse(items) } catch { items = [] }
                                }
                                return (
                                  <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: C.white, borderRadius: 14,
                                    padding: '12px 16px',
                                    border: `1px solid ${C.border}`,
                                    boxShadow: '0 1px 4px rgba(26,26,24,0.04)',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                      <div style={{
                                        width: 30, height: 30, borderRadius: 8,
                                        background: C.black, color: C.yellow,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 800, flexShrink: 0,
                                      }}>
                                        {p.sequence}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: C.black }}>
                                          {p.clientName}
                                        </div>
                                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
                                          {p.address}
                                        </div>
                                        {items.length > 0 && (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                            {items.map((item, i) => (
                                              <span key={i} style={{
                                                fontSize: 10, background: C.yellowBg,
                                                color: C.yellowDark, borderRadius: 20,
                                                padding: '2px 8px', fontWeight: 600,
                                                border: `1px solid ${C.yellowLight}`,
                                              }}>
                                                {item.name} ×{item.qty}
                                              </span>
                                            ))}
                                            {p.totalPrice && (
                                              <span style={{
                                                fontSize: 11, fontWeight: 800,
                                                color: C.yellowDark, marginLeft: 4,
                                              }}>
                                                {p.totalPrice} MAD
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        {p.failureNote && (
                                          <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>
                                            ⚠️ {p.failureNote}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <StatusBadge status={p.status} />
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Barre actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 800, color: C.yellowDark, letterSpacing: 1,
                            }}>
                              {points.length} POINT{points.length !== 1 ? 'S' : ''} DE PASSAGE
                            </span>
                            <button
                              onClick={() => {
                                setShowAddPoint(!showAddPoint)
                                setPointError(''); setPointSuccess('')
                                setPointForm({ clientName: '', address: '', phone: '', note: '' })
                              }}
                              style={{
                                background: showAddPoint ? C.white : C.yellow,
                                color:      showAddPoint ? C.gray : C.black,
                                border:     `1px solid ${showAddPoint ? C.border : C.yellow}`,
                                borderRadius: 10, padding: '7px 14px',
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                transition: 'all .15s',
                                boxShadow: showAddPoint ? 'none' : `0 4px 12px rgba(245,158,11,0.25)`,
                              }}
                            >
                              {showAddPoint ? '✕ Annuler' : '+ Ajouter un point'}
                            </button>
                          </div>

                          {/* Formulaire ajout point */}
                          {showAddPoint && (
                            <form onSubmit={handleAddPoint} style={{
                              background: C.white, borderRadius: 14,
                              border: `1px solid ${C.border}`,
                              padding: 20,
                              boxShadow: '0 4px 20px rgba(26,26,24,0.08)',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: 8,
                                  background: C.yellow, display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  fontSize: 14,
                                }}>📍</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.black }}>
                                  Nouveau point de livraison — n°{points.length + 1}
                                </div>
                              </div>

                              {pointError && (
                                <div style={{
                                  background: C.redBg, border: `1px solid #FECACA`,
                                  color: C.red, fontSize: 12, borderRadius: 8,
                                  padding: '8px 12px', marginBottom: 12,
                                }}>
                                  {pointError}
                                </div>
                              )}
                              {pointSuccess && (
                                <div style={{
                                  background: C.greenBg, border: `1px solid #BBF7D0`,
                                  color: C.green, fontSize: 12, borderRadius: 8,
                                  padding: '8px 12px', marginBottom: 12,
                                }}>
                                  {pointSuccess}
                                </div>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                  <label style={labelStyle}>NOM DU CLIENT *</label>
                                  <input
                                    type="text"
                                    value={pointForm.clientName}
                                    onChange={e => setPointForm({ ...pointForm, clientName: e.target.value })}
                                    placeholder="Ex: Ahmed Benali"
                                    required
                                    style={inputStyle}
                                  />
                                </div>
                                <div>
                                  <label style={labelStyle}>TÉLÉPHONE</label>
                                  <input
                                    type="tel"
                                    value={pointForm.phone}
                                    onChange={e => setPointForm({ ...pointForm, phone: e.target.value })}
                                    placeholder="Ex: 0612345678"
                                    style={inputStyle}
                                  />
                                </div>
                              </div>

                              <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>ADRESSE DE LIVRAISON *</label>
                                <input
                                  type="text"
                                  value={pointForm.address}
                                  onChange={e => setPointForm({ ...pointForm, address: e.target.value })}
                                  placeholder="Ex: 12 Rue Mohammed V, Marrakech"
                                  required
                                  style={inputStyle}
                                />
                              </div>

                              <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>INSTRUCTIONS (OPTIONNEL)</label>
                                <input
                                  type="text"
                                  value={pointForm.note}
                                  onChange={e => setPointForm({ ...pointForm, note: e.target.value })}
                                  placeholder="Ex: Sonnez au portail, 2ème étage…"
                                  style={inputStyle}
                                />
                              </div>

                              <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                  type="submit"
                                  disabled={addingPoint}
                                  style={{
                                    flex: 1, background: addingPoint ? C.grayLight : C.yellow,
                                    color: addingPoint ? C.gray : C.black,
                                    border: 'none', borderRadius: 10, padding: '11px 0',
                                    fontSize: 13, fontWeight: 800,
                                    cursor: addingPoint ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    boxShadow: addingPoint ? 'none' : `0 4px 14px rgba(245,158,11,0.3)`,
                                    transition: 'all .15s',
                                  }}
                                >
                                  {addingPoint ? (
                                    <>
                                      <div style={{
                                        width: 14, height: 14,
                                        border: `2px solid ${C.gray}`,
                                        borderTopColor: 'transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 0.7s linear infinite',
                                      }} />
                                      Ajout en cours…
                                    </>
                                  ) : `✓ Ajouter le point n°${points.length + 1}`}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setShowAddPoint(false); setPointError('') }}
                                  style={{
                                    padding: '11px 18px',
                                    background: C.white,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 10, color: C.gray,
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                  }}
                                >
                                  Annuler
                                </button>
                              </div>
                            </form>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus, select:focus { outline: 2px solid ${C.yellow}; outline-offset: -1px; }
        tr:hover td { background: ${C.yellowBg} !important; transition: background .1s; }
      `}</style>
    </div>
  )
}
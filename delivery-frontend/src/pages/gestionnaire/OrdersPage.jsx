import React, { useEffect, useState } from 'react'
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
        orderId:    selected,
        clientName: pointForm.clientName,
        address:    pointForm.address,
        latitude:   31.6295,
        longitude:  -7.9811,
        sequence:   points.length + 1,
        failureNote: pointForm.note || null,
      })
      setPointSuccess(`Point n°${points.length + 1} ajoute avec succes !`)
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

  const inputSt = {
    width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 11,
    padding: '10px 14px', fontSize: 13, color: C.dark, background: C.card,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color .15s',
  }
  const labelSt = {
    display: 'block', fontSize: 10, fontWeight: 800,
    color: C.textSecondary, marginBottom: 7, letterSpacing: 1.2,
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.brand, letterSpacing: 1.5, marginBottom: 4 }}>
              MANAGEMENT
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.dark, letterSpacing: '-0.5px' }}>
              Gestion des tournees
            </h1>
          </div>
          <div style={{
            marginLeft: 'auto',
            background: '#FFF4EF', border: `1px solid #FFD5C2`,
            borderRadius: 10, padding: '6px 14px',
            fontSize: 12, fontWeight: 700, color: C.brand,
          }}>
            {orders.length} tournee{orders.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* New order form */}
        <div style={{
          background: C.card, borderRadius: 18,
          border: `1.5px solid ${C.border}`,
          padding: 24, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: C.brand, display: 'flex', alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(255,255,255,0.9)' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>Nouvelle tournee</div>
              <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>Assigner un livreur a une date</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelSt}>LIVREUR</label>
              <select
                value={form.driverId}
                onChange={e => setForm({ ...form, driverId: e.target.value })}
                style={{ ...inputSt, cursor: 'pointer', appearance: 'none' }}
              >
                <option value="">Choisir un livreur...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.vehicle}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelSt}>DATE</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                style={{ ...inputSt, width: 'auto' }}
              />
            </div>

            <button
              onClick={createOrder}
              disabled={!form.driverId || !form.date || creating}
              style={{
                background: (!form.driverId || !form.date || creating) ? C.border : C.brand,
                color:      (!form.driverId || !form.date || creating) ? C.textSecondary : '#fff',
                border: 'none', borderRadius: 11, padding: '11px 22px',
                fontSize: 13, fontWeight: 800,
                cursor: creating ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap', transition: 'all .15s',
              }}
            >
              {creating ? 'Creation...' : '+ Creer la tournee'}
            </button>
          </div>

          {drivers.length === 0 && (
            <div style={{
              marginTop: 14, fontSize: 12, color: C.brand,
              background: '#FFF4EF', border: `1px solid #FFD5C2`,
              borderRadius: 9, padding: '9px 13px',
            }}>
              Aucun livreur trouve — creez d'abord un compte livreur dans la section Equipe
            </div>
          )}
        </div>

        {/* Orders table */}
        <div style={{
          background: C.card, borderRadius: 18,
          border: `1.5px solid ${C.border}`,
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 60 }}>
              <div style={{ width: 22, height: 22, border: `3px solid ${C.border}`, borderTopColor: C.brand, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: C.textSecondary, fontSize: 14 }}>Chargement...</span>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textSecondary }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: C.border, margin: '0 auto 16px' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Aucune tournee creee</div>
              <div style={{ fontSize: 13 }}>Utilisez le formulaire ci-dessus pour commencer</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.dark }}>
                  {['Date', 'Livreur', 'Vehicule', 'Points', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '13px 20px', textAlign: 'left',
                      fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)',
                      letterSpacing: 1.2, textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <React.Fragment key={o.id}>
                    <tr style={{
                      background: selected === o.id ? '#FFF4EF' : idx % 2 === 0 ? C.card : C.bg,
                      borderBottom: `1px solid ${C.border}`,
                      transition: 'background .1s',
                    }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: C.dark }}>{o.date}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: '#FFF4EF', border: `2px solid ${C.brand}`,
                            color: C.brand,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, flexShrink: 0,
                          }}>
                            {(o.Driver?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ color: C.dark, fontWeight: 600 }}>{o.Driver?.name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', color: C.textSecondary }}>{o.Driver?.vehicle || '—'}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          background: '#FFF4EF', color: C.brand,
                          border: `1px solid #FFD5C2`,
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
                            background: selected === o.id ? C.brand : 'transparent',
                            color:      selected === o.id ? '#fff' : C.brand,
                            border: `1.5px solid ${selected === o.id ? C.brand : '#FFD5C2'}`,
                            borderRadius: 9, padding: '6px 14px',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            transition: 'all .15s',
                          }}
                        >
                          {selected === o.id ? 'Masquer' : 'Voir points'}
                        </button>
                      </td>
                    </tr>

                    {/* Points panel */}
                    {selected === o.id && (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px 24px', background: '#FFF4EF', borderBottom: `1px solid ${C.border}` }}>

                          {/* Points list */}
                          {points.length === 0 ? (
                            <div style={{
                              textAlign: 'center', padding: 16, marginBottom: 16,
                              color: C.textSecondary, fontSize: 13,
                              background: C.card, borderRadius: 12,
                              border: `1.5px dashed ${C.border}`,
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
                                    background: C.card, borderRadius: 14,
                                    padding: '13px 16px',
                                    border: `1.5px solid ${C.border}`,
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                      <div style={{
                                        width: 30, height: 30, borderRadius: 9,
                                        background: C.brand, color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 800, flexShrink: 0,
                                      }}>
                                        {p.sequence}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{p.clientName}</div>
                                        <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>{p.address}</div>
                                        {items.length > 0 && (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
                                            {items.map((item, i) => (
                                              <span key={i} style={{
                                                fontSize: 10, background: '#FFF4EF',
                                                color: C.brand, borderRadius: 20,
                                                padding: '2px 9px', fontWeight: 700,
                                                border: `1px solid #FFD5C2`,
                                              }}>
                                                {item.name} x{item.qty}
                                              </span>
                                            ))}
                                            {p.totalPrice && (
                                              <span style={{ fontSize: 11, fontWeight: 800, color: C.brand, marginLeft: 4 }}>
                                                {p.totalPrice} MAD
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        {p.failureNote && (
                                          <div style={{ fontSize: 11, color: C.red, marginTop: 5, fontWeight: 600 }}>
                                            {p.failureNote}
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

                          {/* Action bar */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: C.brand, letterSpacing: 1.2 }}>
                              {points.length} POINT{points.length !== 1 ? 'S' : ''} DE PASSAGE
                            </span>
                            <button
                              onClick={() => {
                                setShowAddPoint(!showAddPoint)
                                setPointError(''); setPointSuccess('')
                                setPointForm({ clientName: '', address: '', phone: '', note: '' })
                              }}
                              style={{
                                background: showAddPoint ? C.card : C.brand,
                                color:      showAddPoint ? C.textSecondary : '#fff',
                                border: `1.5px solid ${showAddPoint ? C.border : C.brand}`,
                                borderRadius: 10, padding: '8px 16px',
                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                transition: 'all .15s',
                              }}
                            >
                              {showAddPoint ? 'Annuler' : '+ Ajouter un point'}
                            </button>
                          </div>

                          {/* Add point form */}
                          {showAddPoint && (
                            <form onSubmit={handleAddPoint} style={{
                              background: C.card, borderRadius: 14,
                              border: `1.5px solid ${C.border}`,
                              padding: 20,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: 8,
                                  background: C.brand, display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <div style={{ width: 10, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.9)' }} />
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: C.dark }}>
                                  Nouveau point de livraison — n°{points.length + 1}
                                </div>
                              </div>

                              {pointError && (
                                <div style={{ background: '#FEF2F2', border: `1px solid #FECACA`, color: C.red, fontSize: 12, borderRadius: 9, padding: '9px 13px', marginBottom: 14, fontWeight: 600 }}>
                                  {pointError}
                                </div>
                              )}
                              {pointSuccess && (
                                <div style={{ background: '#E8FBF0', border: `1px solid #B3EED0`, color: C.green, fontSize: 12, borderRadius: 9, padding: '9px 13px', marginBottom: 14, fontWeight: 600 }}>
                                  {pointSuccess}
                                </div>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                  <label style={labelSt}>NOM DU CLIENT *</label>
                                  <input type="text" value={pointForm.clientName}
                                    onChange={e => setPointForm({ ...pointForm, clientName: e.target.value })}
                                    placeholder="Ex: Ahmed Benali" required style={inputSt}
                                    onFocus={e => e.target.style.borderColor = C.brand}
                                    onBlur={e => e.target.style.borderColor = C.border}
                                  />
                                </div>
                                <div>
                                  <label style={labelSt}>TELEPHONE</label>
                                  <input type="tel" value={pointForm.phone}
                                    onChange={e => setPointForm({ ...pointForm, phone: e.target.value })}
                                    placeholder="Ex: 0612345678" style={inputSt}
                                    onFocus={e => e.target.style.borderColor = C.brand}
                                    onBlur={e => e.target.style.borderColor = C.border}
                                  />
                                </div>
                              </div>

                              <div style={{ marginBottom: 12 }}>
                                <label style={labelSt}>ADRESSE DE LIVRAISON *</label>
                                <input type="text" value={pointForm.address}
                                  onChange={e => setPointForm({ ...pointForm, address: e.target.value })}
                                  placeholder="Ex: 12 Rue Mohammed V, Marrakech" required style={inputSt}
                                  onFocus={e => e.target.style.borderColor = C.brand}
                                  onBlur={e => e.target.style.borderColor = C.border}
                                />
                              </div>

                              <div style={{ marginBottom: 18 }}>
                                <label style={labelSt}>INSTRUCTIONS (OPTIONNEL)</label>
                                <input type="text" value={pointForm.note}
                                  onChange={e => setPointForm({ ...pointForm, note: e.target.value })}
                                  placeholder="Ex: Sonnez au portail, 2eme etage..." style={inputSt}
                                  onFocus={e => e.target.style.borderColor = C.brand}
                                  onBlur={e => e.target.style.borderColor = C.border}
                                />
                              </div>

                              <div style={{ display: 'flex', gap: 10 }}>
                                <button type="submit" disabled={addingPoint} style={{
                                  background: addingPoint ? C.border : C.brand,
                                  color: addingPoint ? C.textSecondary : '#fff',
                                  border: 'none', borderRadius: 11,
                                  padding: '11px 22px', fontSize: 13, fontWeight: 800,
                                  cursor: addingPoint ? 'not-allowed' : 'pointer',
                                }}>
                                  {addingPoint ? 'Ajout...' : 'Ajouter le point'}
                                </button>
                                <button type="button"
                                  onClick={() => { setShowAddPoint(false); setPointError(''); setPointSuccess('') }}
                                  style={{
                                    background: 'transparent', color: C.textSecondary,
                                    border: `1.5px solid ${C.border}`, borderRadius: 11,
                                    padding: '11px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
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

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
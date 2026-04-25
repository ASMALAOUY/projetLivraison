import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import api from '../../api/api'

const VEHICLES = ['Moto', 'Vélo', 'Voiture', 'Camionnette']
const VEHICLE_ICONS = { Moto: '🏍️', Vélo: '🚲', Voiture: '🚗', Camionnette: '🚐' }
const Y = '#F59E0B', F = '#D97706', DARK = '#1A1A18'

export default function DriversPage() {
  const [drivers,  setDrivers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [form,     setForm]     = useState({ name: '', phone: '', vehicle: '', password: '' })
  const [creating, setCreating] = useState(false)

  const loadDrivers = async () => {
    try { const { data } = await api.get('/drivers'); setDrivers(data) }
    catch (err) { setError(err.response?.data?.error || err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { loadDrivers() }, [])

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!form.name || !form.phone || !form.password) return setError('Nom, téléphone et mot de passe requis')
    setCreating(true)
    try {
      await api.post('/drivers', form)
      setSuccess('Livreur ajouté !'); setForm({ name: '', phone: '', vehicle: '', password: '' }); setShowForm(false)
      await loadDrivers(); setTimeout(() => setSuccess(''), 3000)
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setCreating(false) }
  }

  const toggleStatus = async (id) => {
    try { await api.patch(`/drivers/${id}/status`); await loadDrivers() }
    catch (err) { setError(err.response?.data?.error || 'Erreur') }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return
    setDeleting(id); setError('')
    try { await api.delete(`/drivers/${id}`); setSuccess(`"${name}" supprimé.`); await loadDrivers(); setTimeout(() => setSuccess(''), 3000) }
    catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setDeleting(null) }
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.pageTitle}>Gestion des livreurs</h1>
            <p style={s.pageSub}>{drivers.length} livreur(s) enregistré(s)</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setError('') }} style={showForm ? s.cancelBtn : s.addBtn}>
            {showForm ? '✕ Annuler' : '+ Ajouter un livreur'}
          </button>
        </div>

        {error   && <div style={s.errorBox}>❌ {error}</div>}
        {success && <div style={s.successBox}>✅ {success}</div>}

        {/* Form */}
        {showForm && (
          <div style={s.formCard}>
            <div style={s.formHeader}>
              <h2 style={s.formTitle}>Nouveau livreur</h2>
              <p style={s.formSub}>Remplissez les informations</p>
            </div>
            <form onSubmit={handleCreate} style={s.form}>
              <div style={s.formGrid}>
                {[
                  { key: 'name',     label: 'Nom complet *',  type: 'text',     ph: 'Prénom Nom' },
                  { key: 'phone',    label: 'Téléphone *',     type: 'tel',      ph: '06xxxxxxxx' },
                  { key: 'password', label: 'Mot de passe *',  type: 'password', ph: 'Min. 6 caractères' },
                ].map(({ key, label, type, ph }) => (
                  <div key={key} style={s.field}>
                    <label style={s.label}>{label}</label>
                    <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                      placeholder={ph} required style={s.input} />
                  </div>
                ))}
                <div style={s.field}>
                  <label style={s.label}>Véhicule</label>
                  <select value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} style={s.input}>
                    <option value="">Choisir…</option>
                    {VEHICLES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={creating} style={{ ...s.submitBtn, opacity: creating ? 0.7 : 1 }}>
                {creating ? 'Création…' : '✓ Ajouter le livreur'}
              </button>
            </form>
          </div>
        )}

        {/* Table */}
        <div style={s.tableCard}>
          {loading ? (
            <div style={s.loadingBox}><div style={s.spinner} /><span style={{ color: '#999', fontSize: 14 }}>Chargement…</span></div>
          ) : drivers.length === 0 ? (
            <div style={s.emptyBox}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
              <p style={s.emptyTitle}>Aucun livreur enregistré</p>
              <p style={s.emptySub}>Cliquez sur "Ajouter un livreur" pour commencer</p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  {['Livreur', 'Téléphone', 'Véhicule', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.map((d, idx) => (
                  <tr key={d.id} style={{ ...s.tr, background: idx % 2 === 0 ? '#fff' : '#FFFBEB' }}>
                    <td style={s.td}>
                      <div style={s.driverCell}>
                        <div style={s.avatar}>{d.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
                        <div>
                          <p style={s.driverName}>{d.name}</p>
                          <p style={s.driverMeta}>ID: {d.id.slice(0,8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={s.phone}>{d.phone || '—'}</span></td>
                    <td style={s.td}>
                      {d.vehicle ? (
                        <span style={s.vehicleBadge}>{VEHICLE_ICONS[d.vehicle] || '🚗'} {d.vehicle}</span>
                      ) : '—'}
                    </td>
                    <td style={s.td}><StatusBadge status={d.status} /></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => toggleStatus(d.id)}
                          style={d.status === 'active' ? s.btnWarn : s.btnGreen}>
                          {d.status === 'active' ? '⏸ Désactiver' : '▶ Activer'}
                        </button>
                        <button onClick={() => handleDelete(d.id, d.name)} disabled={deleting === d.id}
                          style={{ ...s.btnDanger, opacity: deleting === d.id ? 0.4 : 1 }}>
                          {deleting === d.id ? '…' : '🗑 Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  page:       { minHeight: '100vh', background: '#FAFAF8', fontFamily: 'system-ui, sans-serif' },
  container:  { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  header:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle:  { fontSize: 26, fontWeight: 900, color: DARK, letterSpacing: -0.5 },
  pageSub:    { fontSize: 13, color: '#999', marginTop: 3 },
  addBtn:     { padding: '10px 22px', borderRadius: 12, border: 'none', background: Y, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  cancelBtn:  { padding: '10px 22px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', color: '#666', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  errorBox:   { background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '12px 16px', color: '#92400E', fontSize: 14, marginBottom: 16 },
  successBox: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', color: '#16A34A', fontSize: 14, marginBottom: 16 },

  formCard:   { background: '#fff', borderRadius: 20, border: `1.5px solid ${Y}`, overflow: 'hidden', marginBottom: 24 },
  formHeader: { background: Y, padding: '20px 24px' },
  formTitle:  { fontSize: 17, fontWeight: 800, color: '#fff' },
  formSub:    { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  form:       { padding: 24 },
  formGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  field:      { display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 11, fontWeight: 800, color: '#999', letterSpacing: 1 },
  input:      { padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, color: DARK, outline: 'none' },
  submitBtn:  { padding: '13px 28px', borderRadius: 12, border: 'none', background: Y, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' },

  tableCard:  { background: '#fff', borderRadius: 20, border: '1.5px solid #EBEBEB', overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  thead:      { background: '#FFFBEB' },
  th:         { padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: F, letterSpacing: 1, textTransform: 'uppercase', borderBottom: `2px solid ${Y}` },
  tr:         { borderBottom: '1px solid #F5F5F3' },
  td:         { padding: '14px 20px', fontSize: 14 },
  driverCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar:     { width: 36, height: 36, borderRadius: '50%', background: '#FFFBEB', border: `2px solid ${Y}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: F, flexShrink: 0 },
  driverName: { fontSize: 14, fontWeight: 700, color: DARK },
  driverMeta: { fontSize: 11, color: '#CCC' },
  phone:      { fontSize: 13, color: '#555' },
  vehicleBadge:{ background: '#FFFBEB', color: F, border: `1px solid #FDE68A`, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700 },
  btnWarn:    { padding: '7px 14px', borderRadius: 8, border: '1px solid #FDE68A', background: '#FFFBEB', color: F, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnGreen:   { padding: '7px 14px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnDanger:  { padding: '7px 14px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' },

  loadingBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 60 },
  spinner:    { width: 22, height: 22, border: `3px solid ${Y}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  emptyBox:   { textAlign: 'center', padding: 60 },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#555' },
  emptySub:   { fontSize: 13, color: '#CCC', marginTop: 6 },
}
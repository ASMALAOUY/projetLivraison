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
}

const VEHICLES = ['Moto', 'Velo', 'Voiture', 'Camionnette']

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
    if (!form.name || !form.phone || !form.password) return setError('Nom, telephone et mot de passe requis')
    setCreating(true)
    try {
      await api.post('/drivers', form)
      setSuccess('Livreur ajoute !')
      setForm({ name: '', phone: '', vehicle: '', password: '' })
      setShowForm(false)
      await loadDrivers()
      setTimeout(() => setSuccess(''), 3000)
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
    try {
      await api.delete(`/drivers/${id}`)
      setSuccess(`"${name}" supprime.`)
      await loadDrivers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) { setError(err.response?.data?.error || 'Erreur') }
    finally { setDeleting(null) }
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <p style={s.pageTag}>EQUIPE</p>
            <h1 style={s.pageTitle}>Gestion des livreurs</h1>
            <p style={s.pageSub}>{drivers.length} livreur(s) enregistre(s)</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
            style={showForm ? s.cancelBtn : s.addBtn}
          >
            {showForm ? 'Annuler' : '+ Ajouter un livreur'}
          </button>
        </div>

        {error   && <div style={s.errorBox}>{error}</div>}
        {success && <div style={s.successBox}>{success}</div>}

        {/* Form */}
        {showForm && (
          <div style={s.formCard}>
            <div style={s.formCardHeader}>
              <h2 style={s.formTitle}>Nouveau livreur</h2>
              <p style={s.formSub}>Remplissez les informations du livreur</p>
            </div>
            <form onSubmit={handleCreate} style={s.form}>
              <div style={s.formGrid}>
                {[
                  { key: 'name',     label: 'NOM COMPLET *', type: 'text',     ph: 'Prenom Nom' },
                  { key: 'phone',    label: 'TELEPHONE *',   type: 'tel',      ph: '06xxxxxxxx' },
                  { key: 'password', label: 'MOT DE PASSE *',type: 'password', ph: 'Min. 6 caracteres' },
                ].map(({ key, label, type, ph }) => (
                  <div key={key} style={s.field}>
                    <label style={s.label}>{label}</label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      placeholder={ph}
                      required
                      style={s.input}
                      onFocus={e => e.target.style.borderColor = C.brand}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                ))}
                <div style={s.field}>
                  <label style={s.label}>VEHICULE</label>
                  <select
                    value={form.vehicle}
                    onChange={e => setForm({ ...form, vehicle: e.target.value })}
                    style={s.input}
                  >
                    <option value="">Choisir...</option>
                    {VEHICLES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={creating} style={{ ...s.submitBtn, opacity: creating ? 0.7 : 1 }}>
                {creating ? 'Creation...' : 'Ajouter le livreur'}
              </button>
            </form>
          </div>
        )}

        {/* Table */}
        <div style={s.tableCard}>
          {loading ? (
            <div style={s.loadingBox}>
              <div style={s.spinner} />
              <span style={{ color: C.textSecondary, fontSize: 14 }}>Chargement...</span>
            </div>
          ) : drivers.length === 0 ? (
            <div style={s.emptyBox}>
              <div style={s.emptyCircle} />
              <p style={s.emptyTitle}>Aucun livreur enregistre</p>
              <p style={s.emptySub}>Cliquez sur "Ajouter un livreur" pour commencer</p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  {['Livreur', 'Telephone', 'Vehicule', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.map((d, idx) => (
                  <tr key={d.id} style={{ ...s.tr, background: idx % 2 === 0 ? C.card : C.bg }}>
                    <td style={s.td}>
                      <div style={s.driverCell}>
                        <div style={s.avatar}>
                          {d.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p style={s.driverName}>{d.name}</p>
                          <p style={s.driverMeta}>ID: {d.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={s.phone}>{d.phone || '—'}</span></td>
                    <td style={s.td}>
                      {d.vehicle
                        ? <span style={s.vehicleBadge}>{d.vehicle}</span>
                        : <span style={{ color: C.textMuted }}>—</span>
                      }
                    </td>
                    <td style={s.td}><StatusBadge status={d.status} /></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => toggleStatus(d.id)}
                          style={d.status === 'active' ? s.btnWarn : s.btnGreen}
                        >
                          {d.status === 'active' ? 'Desactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
                          disabled={deleting === d.id}
                          style={{ ...s.btnDanger, opacity: deleting === d.id ? 0.4 : 1 }}
                        >
                          {deleting === d.id ? '...' : 'Supprimer'}
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
  page:      { minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },

  header:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  pageTag:   { fontSize: 11, fontWeight: 800, color: C.brand, letterSpacing: 1.5, marginBottom: 4 },
  pageTitle: { fontSize: 26, fontWeight: 900, color: C.dark, letterSpacing: -0.5, marginBottom: 4 },
  pageSub:   { fontSize: 13, color: C.textSecondary },

  addBtn: {
    padding: '11px 22px', borderRadius: 13, border: 'none',
    background: C.brand, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  cancelBtn: {
    padding: '11px 22px', borderRadius: 13, border: `1.5px solid ${C.border}`,
    background: C.card, color: C.textSecondary, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },

  errorBox:   { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', color: '#991B1B', fontSize: 14, marginBottom: 16, fontWeight: 600 },
  successBox: { background: '#E8FBF0', border: '1px solid #B3EED0', borderRadius: 12, padding: '12px 16px', color: '#1D6A3A', fontSize: 14, marginBottom: 16, fontWeight: 600 },

  formCard:       { background: C.card, borderRadius: 20, border: `1.5px solid ${C.border}`, overflow: 'hidden', marginBottom: 24 },
  formCardHeader: { background: C.brand, padding: '20px 24px' },
  formTitle:      { fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 3 },
  formSub:        { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  form:           { padding: 24 },
  formGrid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  field:          { display: 'flex', flexDirection: 'column', gap: 7 },
  label:          { fontSize: 11, fontWeight: 800, color: C.textSecondary, letterSpacing: 1.2 },
  input: {
    padding: '12px 14px', borderRadius: 11, border: `1.5px solid ${C.border}`,
    fontSize: 14, color: C.dark, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color .15s',
  },
  submitBtn: {
    padding: '13px 28px', borderRadius: 13, border: 'none',
    background: C.brand, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
  },

  tableCard: { background: C.card, borderRadius: 20, border: `1.5px solid ${C.border}`, overflow: 'hidden' },
  table:     { width: '100%', borderCollapse: 'collapse' },
  thead:     { background: C.dark },
  th: {
    padding: '14px 20px', textAlign: 'left',
    fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  tr:  { borderBottom: `1px solid ${C.border}` },
  td:  { padding: '14px 20px', fontSize: 14 },

  driverCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: '#FFF4EF', border: `2px solid ${C.brand}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 800, color: C.brand, flexShrink: 0,
  },
  driverName: { fontSize: 14, fontWeight: 700, color: C.dark },
  driverMeta: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  phone:      { fontSize: 13, color: C.textSecondary },

  vehicleBadge: {
    background: '#FFF4EF', color: C.brand, border: `1px solid #FFD5C2`,
    borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700,
  },

  btnWarn: {
    padding: '7px 14px', borderRadius: 8,
    border: `1px solid #FDE68A`, background: '#FFFBEB',
    color: '#B45309', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  btnGreen: {
    padding: '7px 14px', borderRadius: 8,
    border: `1px solid #B3EED0`, background: '#E8FBF0',
    color: C.green, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  btnDanger: {
    padding: '7px 14px', borderRadius: 8,
    border: `1px solid #FECACA`, background: '#FEF2F2',
    color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },

  loadingBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 60 },
  spinner: {
    width: 22, height: 22,
    border: `3px solid ${C.border}`, borderTopColor: C.brand,
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  emptyBox:   { textAlign: 'center', padding: 60 },
  emptyCircle:{ width: 64, height: 64, borderRadius: 32, background: C.border, margin: '0 auto 16px' },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: C.dark, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.textSecondary },
}
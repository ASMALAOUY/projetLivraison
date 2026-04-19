import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import useAuthStore from '../../store/authStore'
import api from '../../api/api'

// ── Catalogue de produits disponibles ─────────────────────
const CATALOGUE = [
  { id: 1, name: 'Colis standard',     emoji: '📦', price: 15,  description: 'Jusqu\'à 5kg' },
  { id: 2, name: 'Colis express',      emoji: '⚡', price: 30,  description: 'Livraison < 2h' },
  { id: 3, name: 'Documents',          emoji: '📄', price: 10,  description: 'Enveloppes, papiers' },
  { id: 4, name: 'Courses alimentaires',emoji: '🛒', price: 20, description: 'Épicerie, supermarché' },
  { id: 5, name: 'Pharmacie',          emoji: '💊', price: 12,  description: 'Médicaments, ordonnance' },
  { id: 6, name: 'Fleurs / Cadeaux',   emoji: '🎁', price: 25,  description: 'Livraison soignée' },
  { id: 7, name: 'Restaurant / Repas', emoji: '🍔', price: 18,  description: 'Plats chauds' },
  { id: 8, name: 'Électronique',       emoji: '💻', price: 35,  description: 'Fragile, assuré' },
]

const STEPS = [
  { key: 'pending',     label: 'Confirmée', emoji: '📋' },
  { key: 'in_progress', label: 'En route',  emoji: '🚴' },
  { key: 'delivered',   label: 'Livrée',    emoji: '✅' },
]

const STATUS_INFO = {
  pending:     { msg: 'Commande confirmée. Un livreur va prendre en charge votre colis.', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  in_progress: { msg: 'Votre livreur est en route ! Restez disponible.',                  color: 'bg-blue-50 border-blue-200 text-blue-800' },
  delivered:   { msg: 'Livraison effectuée avec succès. Merci de votre confiance !',      color: 'bg-green-50 border-green-200 text-green-800' },
  failed:      { msg: 'La livraison a échoué. Contactez le support.',                     color: 'bg-red-50 border-red-200 text-red-800' },
}

export default function TrackingPage() {
  const { user }   = useAuthStore()
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState('list')
  const [selected, setSelected] = useState(null)
  const [cart,     setCart]     = useState({})
  const [form,     setForm]     = useState({ address: '', pickupAddress: '', note: '' })
  const [step,     setStep]     = useState(1)  // 1=catalogue, 2=adresse, 3=résumé
  const [submitting, setSubmitting] = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/client/my-orders')
      setOrders(data)
    } catch { setOrders([]) }
    finally  { setLoading(false) }
  }

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 20000)
    return () => clearInterval(interval)
  }, [])

  // Panier
  const addToCart    = (product) => setCart(c => ({ ...c, [product.id]: { ...product, qty: (c[product.id]?.qty || 0) + 1 } }))
  const removeFromCart = (id)    => setCart(c => { const n = { ...c }; if (n[id]?.qty > 1) n[id].qty--; else delete n[id]; return n })
  const cartItems    = Object.values(cart).filter(i => i.qty > 0)
  const cartTotal    = cartItems.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount    = cartItems.reduce((s, i) => s + i.qty, 0)

  const resetForm = () => {
    setCart({}); setForm({ address: '', pickupAddress: '', note: '' })
    setStep(1); setError(''); setSuccess('')
  }

  const handleSubmit = async () => {
    if (!form.address.trim()) { setError('Adresse de livraison requise'); return }
    setError(''); setSubmitting(true)
    try {
      const items = cartItems.map(i => ({ name: i.name, qty: i.qty, price: i.price, emoji: i.emoji }))
      await api.post('/client/order', {
        address:       form.address,
        pickupAddress: form.pickupAddress || 'Entrepôt central',
        note:          form.note,
        items,
        latitude:  31.6295,
        longitude: -7.9811,
      })
      setSuccess('Commande passée avec succès !')
      await loadOrders()
      setTimeout(() => { resetForm(); setView('list') }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la commande')
    } finally {
      setSubmitting(false)
    }
  }

  // ── VUE COMMANDE ────────────────────────────────────────
  if (view === 'order') return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header formulaire */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { step > 1 ? setStep(s => s-1) : (resetForm(), setView('list')) }}
            className="text-gray-500 hover:text-gray-800 transition text-sm font-medium">
            ← {step > 1 ? 'Retour' : 'Annuler'}
          </button>
          <div className="flex-1 flex gap-2">
            {[1,2,3].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}/>
            ))}
          </div>
          <span className="text-xs text-gray-400">{step}/3</span>
        </div>

        {/* ÉTAPE 1 — Catalogue */}
        {step === 1 && (
          <div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Que voulez-vous livrer ?</h1>
            <p className="text-sm text-gray-400 mb-5">Sélectionnez un ou plusieurs types de livraison</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {CATALOGUE.map(product => {
                const qty = cart[product.id]?.qty || 0
                return (
                  <div key={product.id}
                    className={`bg-white rounded-2xl border-2 p-4 transition cursor-pointer ${qty > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                    onClick={() => addToCart(product)}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{product.emoji}</span>
                      {qty > 0 && (
                        <div className="flex items-center gap-1.5 bg-blue-600 text-white rounded-full px-2 py-0.5">
                          <button onClick={e => { e.stopPropagation(); removeFromCart(product.id) }}
                            className="text-sm leading-none font-bold hover:text-blue-200">−</button>
                          <span className="text-xs font-bold">{qty}</span>
                          <button onClick={e => { e.stopPropagation(); addToCart(product) }}
                            className="text-sm leading-none font-bold hover:text-blue-200">+</button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{product.description}</p>
                    <p className="text-sm font-bold text-blue-600 mt-2">{product.price} MAD</p>
                  </div>
                )
              })}
            </div>

            {cartCount > 0 && (
              <button onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-bold flex items-center justify-between px-6 transition">
                <span>{cartCount} article{cartCount > 1 ? 's' : ''} sélectionné{cartCount > 1 ? 's' : ''}</span>
                <span>{cartTotal} MAD →</span>
              </button>
            )}
          </div>
        )}

        {/* ÉTAPE 2 — Adresse */}
        {step === 2 && (
          <div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Où livrer ?</h1>
            <p className="text-sm text-gray-400 mb-5">Renseignez les adresses</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Adresse de récupération
                </label>
                <input type="text"
                  value={form.pickupAddress}
                  onChange={e => setForm({ ...form, pickupAddress: e.target.value })}
                  placeholder="Ex: Marché central, Avenue Hassan II…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-400 mt-1">Laisser vide = Entrepôt central</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Adresse de livraison *
                </label>
                <input type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Ex: 12 Rue Mohammed V, Marrakech"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Instructions pour le livreur
                </label>
                <textarea
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="Ex: Sonnez 2 fois, 1er étage, code portail 1234…"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>
            </div>

            <button onClick={() => {
              if (!form.address.trim()) { setError('Adresse de livraison requise'); return }
              setError(''); setStep(3)
            }}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-bold transition">
              Continuer →
            </button>
          </div>
        )}

        {/* ÉTAPE 3 — Résumé + confirmation */}
        {step === 3 && (
          <div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">Résumé de la commande</h1>
            <p className="text-sm text-gray-400 mb-5">Vérifiez avant de confirmer</p>

            {error   && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4 font-medium">{success}</div>}

            {/* Articles */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Articles commandés</h3>
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400">x{item.qty} × {item.price} MAD</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-700">{item.qty * item.price} MAD</p>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-bold text-gray-800">Total livraison</span>
                  <span className="font-bold text-blue-600 text-lg">{cartTotal} MAD</span>
                </div>
              </div>
            </div>

            {/* Adresses */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Informations</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-base">📍</span>
                  <div>
                    <p className="text-xs text-gray-400">Récupération chez</p>
                    <p className="font-medium text-gray-700">{form.pickupAddress || 'Entrepôt central'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-base">🏠</span>
                  <div>
                    <p className="text-xs text-gray-400">Livraison à</p>
                    <p className="font-medium text-gray-700">{form.address}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-base">👤</span>
                  <div>
                    <p className="text-xs text-gray-400">Destinataire</p>
                    <p className="font-medium text-gray-700">{user?.name} · {user?.phone}</p>
                  </div>
                </div>
                {form.note && (
                  <div className="flex gap-3">
                    <span className="text-base">💬</span>
                    <div>
                      <p className="text-xs text-gray-400">Instructions</p>
                      <p className="font-medium text-gray-700">{form.note}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <span className="text-base">🕐</span>
                  <div>
                    <p className="text-xs text-gray-400">Délai estimé</p>
                    <p className="font-medium text-gray-700">Aujourd'hui · 30–60 min</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-bold transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Envoi…</>
                : `Confirmer · ${cartTotal} MAD`
              }
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Paiement à la livraison
            </p>
          </div>
        )}
      </div>
    </div>
  )

  // ── VUE DÉTAIL COMMANDE ─────────────────────────────────
  if (view === 'detail' && selected) {
    const info     = STATUS_INFO[selected.status] || STATUS_INFO['pending']
    const stepIdx  = STEPS.findIndex(s => s.key === selected.status)
    const items    = selected.items || []
    const driver   = selected.DeliveryOrder?.Driver

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">

          <button onClick={() => setView('list')}
            className="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1 transition">
            ← Mes commandes
          </button>

          <div className={`rounded-2xl border px-5 py-4 mb-4 ${info.color}`}>
            <StatusBadge status={selected.status} />
            <p className="text-sm mt-2">{info.msg}</p>
          </div>

          {/* Progress bar */}
          {selected.status !== 'failed' && (
            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 mb-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-100 z-0"/>
                <div className="absolute left-0 top-5 h-0.5 bg-blue-500 z-0 transition-all duration-700"
                  style={{ width: stepIdx === 0 ? '0%' : stepIdx === 1 ? '50%' : '100%' }}/>
                {STEPS.map((step, i) => (
                  <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${i <= stepIdx ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}>
                      {step.emoji}
                    </div>
                    <span className={`text-xs font-semibold ${i <= stepIdx ? 'text-blue-600' : 'text-gray-300'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Articles */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Articles</h2>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{item.emoji}</span>
                      <span className="text-sm text-gray-700">{item.name} × {item.qty}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{item.price * item.qty} MAD</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="text-sm font-bold text-gray-800">Total</span>
                  <span className="text-sm font-bold text-blue-600">{selected.totalPrice} MAD</span>
                </div>
              </div>
            </div>
          )}

          {/* Adresses */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Livraison</h2>
            <div className="space-y-3 text-sm">
              {selected.pickupAddress && (
                <div className="flex gap-3">
                  <span>📍</span>
                  <div>
                    <p className="text-xs text-gray-400">Récupéré chez</p>
                    <p className="font-medium text-gray-700">{selected.pickupAddress}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <span>🏠</span>
                <div>
                  <p className="text-xs text-gray-400">Livré à</p>
                  <p className="font-medium text-gray-700">{selected.address}</p>
                </div>
              </div>
              {selected.failureNote && (
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs text-red-500">Raison : {selected.failureNote}</p>
                </div>
              )}
            </div>
          </div>

          {/* Livreur */}
          {driver && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Votre livreur</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                  {driver.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{driver.name}</p>
                  <p className="text-sm text-gray-400">{driver.vehicle}</p>
                </div>
                <a href={`tel:${driver.phone}`}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
                  📞 Appeler
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── VUE LISTE ───────────────────────────────────────────
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'failed')
  const pastOrders   = orders.filter(o => o.status === 'delivered' || o.status === 'failed')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mes commandes</h1>
            <p className="text-sm text-gray-400 mt-0.5">Bonjour, {user?.name?.split(' ')[0]} 👋</p>
          </div>
          <button onClick={() => { resetForm(); setView('order') }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2">
            + Commander
          </button>
        </div>

        {loading ? <LoadingSpinner /> : <>

          {activeOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">En cours</h2>
              <div className="space-y-3">
                {activeOrders.map(order => {
                  const stepIdx = STEPS.findIndex(s => s.key === order.status)
                  return (
                    <button key={order.id}
                      onClick={() => { setSelected(order); setView('detail') }}
                      className="w-full bg-white rounded-2xl border-2 border-blue-100 shadow-sm p-4 text-left hover:border-blue-300 transition">

                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
                        <StatusBadge status={order.status}/>
                        <span className="ml-auto text-gray-300 text-lg">›</span>
                      </div>

                      {/* Articles */}
                      <div className="flex gap-1.5 mb-3 flex-wrap">
                        {(order.items || []).slice(0, 4).map((item, i) => (
                          <span key={i} className="text-lg" title={item.name}>{item.emoji}</span>
                        ))}
                        {(order.items || []).length > 4 && (
                          <span className="text-xs text-gray-400 self-center">+{order.items.length - 4}</span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 truncate mb-1">
                        🏠 {order.address}
                      </p>

                      {order.totalPrice && (
                        <p className="text-sm font-bold text-blue-600">{order.totalPrice} MAD</p>
                      )}

                      {/* Mini progress */}
                      <div className="flex gap-1.5 mt-3">
                        {STEPS.map((step, i) => (
                          <div key={step.key}
                            className={`h-1.5 flex-1 rounded-full transition-all ${i <= stepIdx ? 'bg-blue-500' : 'bg-gray-100'}`}
                          />
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {pastOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Historique</h2>
              <div className="space-y-2">
                {pastOrders.map(order => (
                  <button key={order.id}
                    onClick={() => { setSelected(order); setView('detail') }}
                    className="w-full bg-white rounded-xl border border-gray-100 p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition">
                    <div className="flex gap-1">
                      {(order.items || []).slice(0,3).map((item,i) => (
                        <span key={i} className="text-lg">{item.emoji}</span>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{order.address}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long' })}
                        {order.totalPrice && ` · ${order.totalPrice} MAD`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={order.status}/>
                      <span className="text-gray-300">›</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {orders.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-lg font-bold text-gray-700 mb-2">Aucune commande</h2>
              <p className="text-sm text-gray-400 mb-6">Passez votre première commande maintenant</p>
              <button onClick={() => { resetForm(); setView('order') }}
                className="bg-blue-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-blue-700 transition">
                Commander maintenant
              </button>
            </div>
          )}
        </>}
      </div>
    </div>
  )
}
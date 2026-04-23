import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon   from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import Navbar        from '../../components/Navbar'
import StatusBadge   from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import useAuthStore  from '../../store/authStore'
import api           from '../../api/api'

// ── Fix icônes Leaflet cassées avec Vite ──────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
})

const driverIcon = L.divIcon({
  html: `<div style="background:#2563EB;width:38px;height:38px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:20px;">🛵</div>`,
  className: '',
  iconSize:   [38, 38],
  iconAnchor: [19, 19],
  popupAnchor:[0, -22],
})

const destIcon = L.divIcon({
  html: `<div style="width:34px;height:34px;background:#EF4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:15px;">🏠</span></div>`,
  className: '',
  iconSize:   [34, 34],
  iconAnchor: [17, 34],
  popupAnchor:[0, -36],
})

// ── Données ───────────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'pending',     label: 'Confirmée', icon: '📋' },
  { key: 'in_progress', label: 'En route',  icon: '🚴' },
  { key: 'delivered',   label: 'Livrée',    icon: '✅' },
]

const STATUS_INFO = {
  pending:     { msg: 'Commande confirmée. Un livreur va prendre en charge votre colis.', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  in_progress: { msg: 'Votre livreur est en route ! Suivez-le sur la carte ci-dessous.',  color: 'bg-blue-50 border-blue-200 text-blue-800' },
  delivered:   { msg: 'Livraison effectuée avec succès. Merci de votre confiance !',       color: 'bg-green-50 border-green-200 text-green-800' },
  failed:      { msg: 'La livraison a échoué ou a été annulée.',                           color: 'bg-red-50 border-red-200 text-red-800' },
}

const CATEGORIES = [
  {
    id: 'cafe', label: 'Café', subtitle: 'Boissons chaudes & froides', accent: '#6F4E37',
    photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop',
    items: [
      { id: 'c1', name: 'Café Marocain',     description: 'Cardamome & cannelle',         price: 8,  photo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop' },
      { id: 'c2', name: 'Cappuccino',         description: 'Mousse de lait veloutée',      price: 15, photo: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop' },
      { id: 'c3', name: "Jus d'orange frais", description: 'Pressé minute, 100% naturel', price: 12, photo: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop' },
      { id: 'c4', name: 'Thé à la menthe',    description: 'Gunpowder & menthe fraîche',  price: 10, photo: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop' },
      { id: 'c5', name: 'Smoothie fruits',    description: 'Fraise, banane & mangue',     price: 18, photo: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop' },
      { id: 'c6', name: 'Café Glacé',         description: 'Double espresso sur glace',   price: 20, photo: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: 'resto', label: 'Restaurants', subtitle: 'Plats locaux & internationaux', accent: '#C0392B',
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    items: [
      { id: 'r1', name: 'Pizza Margherita', description: 'Tomate, mozzarella, basilic', price: 55, photo: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop' },
      { id: 'r2', name: 'Couscous royal',   description: 'Agneau, merguez, légumes',   price: 70, photo: 'https://images.unsplash.com/photo-1628294896516-3c88dc6b07af?w=400&h=300&fit=crop' },
      { id: 'r3', name: 'Tajine poulet',    description: 'Citron confit & olives',     price: 65, photo: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop' },
      { id: 'r4', name: 'Burger classique', description: 'Steak haché, cheddar',       price: 50, photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop' },
      { id: 'r5', name: 'Pastilla poulet',  description: 'Feuilleté sucré-salé',       price: 45, photo: 'https://images.unsplash.com/photo-1621501103258-9253c3a5e358?w=400&h=300&fit=crop' },
      { id: 'r6', name: 'Salade niçoise',   description: 'Thon, œuf, olives',          price: 35, photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: 'shop', label: 'Shopping', subtitle: 'Colis, courses & cadeaux', accent: '#1A5276',
    photo: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop',
    items: [
      { id: 's1', name: 'Colis standard',      description: "Jusqu'à 5 kg",          price: 15, photo: 'https://images.unsplash.com/photo-1595079676601-f1adf5be5dee?w=400&h=300&fit=crop' },
      { id: 's2', name: 'Colis express',        description: 'Livraison en < 1h',     price: 30, photo: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=300&fit=crop' },
      { id: 's3', name: 'Documents',            description: 'Enveloppes, contrats',  price: 10, photo: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&h=300&fit=crop' },
      { id: 's4', name: 'Courses alimentaires', description: 'Supermarché, épicerie', price: 20, photo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop' },
      { id: 's5', name: 'Fleurs & Cadeaux',     description: 'Bouquets, coffrets',    price: 25, photo: 'https://images.unsplash.com/photo-1487530811015-780f2f08b77a?w=400&h=300&fit=crop' },
      { id: 's6', name: 'Électronique',         description: 'Fragile, assuré',       price: 35, photo: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: 'pharma', label: 'Pharmacie', subtitle: 'Médicaments & soins', accent: '#1D6A3A',
    photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
    items: [
      { id: 'p1', name: 'Médicaments ordonnance', description: 'Sur ordonnance valide',    price: 12, photo: 'https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=400&h=300&fit=crop' },
      { id: 'p2', name: 'Paracétamol 500mg',      description: 'Boîte de 20 comprimés',   price: 8,  photo: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=300&fit=crop' },
      { id: 'p3', name: 'Crème solaire SPF50+',   description: '150ml, résistant eau',    price: 45, photo: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop' },
      { id: 'p4', name: 'Vitamines & compléments', description: 'Vit C, D, magnésium',    price: 35, photo: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=400&h=300&fit=crop' },
      { id: 'p5', name: 'Masques FFP2',           description: 'Boîte de 10',             price: 15, photo: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&fit=crop' },
      { id: 'p6', name: 'Thermomètre digital',    description: 'Résultat en 10 secondes', price: 60, photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop' },
    ],
  },
]

// ── LiveMap (intégré ici, fix Leaflet + Vite) ─────────────────────────────────
function LiveMap({ driverId, destLat, destLng, destLabel }) {
  const [pos,      setPos]      = useState(null)
  const [MapReady, setMapReady] = useState(false)
  const [MapComps, setMapComps] = useState(null)

  useEffect(() => {
    import('react-leaflet').then(mod => { setMapComps(mod); setMapReady(true) })
  }, [])

  useEffect(() => {
    if (!driverId) return
    const fetchPos = () =>
      api.get(`/tracking/position/${driverId}`)
        .then(r => { if (r.data?.latitude) setPos(r.data) })
        .catch(() => {})
    fetchPos()
    const iv = setInterval(fetchPos, 10000)
    return () => clearInterval(iv)
  }, [driverId])

  if (!MapReady || !MapComps) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Chargement de la carte…</span>
      </div>
    )
  }

  const { MapContainer, TileLayer, Marker, Popup, useMap } = MapComps

  // Recentre la carte à chaque nouvelle position livreur
  function Recenter({ lat, lng }) {
    const map = useMap()
    useEffect(() => { map.setView([lat, lng], map.getZoom()) }, [lat, lng])
    return null
  }

  const center = pos
    ? [pos.latitude,  pos.longitude]
    : destLat && destLng
      ? [destLat, destLng]
      : [31.6295, -7.9811]

  return (
    <div>
      {/* En-tête statut */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className={`w-2 h-2 rounded-full ${pos ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
        <span className="text-sm font-semibold text-gray-700">Suivi GPS en direct</span>
        {pos
          ? <span className="text-xs text-green-600 font-medium ml-auto">● Livreur localisé</span>
          : <span className="text-xs text-gray-400 ml-auto">En attente de position…</span>
        }
      </div>

      {/* Carte Leaflet */}
      <div style={{ height: 280, zIndex: 0, position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Recentrage auto */}
          {pos && <Recenter lat={pos.latitude} lng={pos.longitude} />}

          {/* Marqueur livreur 🛵 */}
          {pos && (
            <Marker position={[pos.latitude, pos.longitude]} icon={driverIcon}>
              <Popup>
                <strong>🛵 Votre livreur</strong><br />
                <small style={{ color: '#666' }}>
                  {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)}
                </small>
              </Popup>
            </Marker>
          )}

          {/* Marqueur destination 🏠 */}
          {destLat && destLng && (
            <Marker position={[destLat, destLng]} icon={destIcon}>
              <Popup>
                <strong>🏠 Adresse de livraison</strong><br />
                <small style={{ color: '#666' }}>{destLabel}</small>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Pied de carte */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 text-xs text-gray-400">
        <span>Mis à jour toutes les 10 secondes</span>
        {pos && <span>📍 {pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}</span>}
      </div>
    </div>
  )
}

// ── RatingModal ───────────────────────────────────────────────────────────────
function RatingModal({ pointId, driverName, onClose, onSubmit }) {
  const [rating,  setRating]  = useState(0)
  const [hover,   setHover]   = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const labels = { 1: 'Très mauvais', 2: 'Mauvais', 3: 'Correct', 4: 'Bien', 5: 'Excellent !' }

  const handleSubmit = async () => {
    if (!rating) { setError('Veuillez choisir une note'); return }
    setLoading(true)
    try {
      await onSubmit(pointId, rating, comment)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="bg-blue-600 px-6 py-5 text-center">
          <p className="text-white text-base font-bold">Évaluer la livraison</p>
          <p className="text-blue-200 text-sm mt-1">
            Comment s'est passée votre livraison avec {driverName} ?
          </p>
        </div>
        <div className="px-6 py-6">
          <div className="flex justify-center gap-3 mb-3">
            {[1,2,3,4,5].map(star => (
              <button key={star}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                className="text-4xl transition-transform hover:scale-110 focus:outline-none"
              >
                <span style={{ color: star <= (hover || rating) ? '#F59E0B' : '#E5E7EB' }}>★</span>
              </button>
            ))}
          </div>
          {(hover || rating) > 0 && (
            <p className="text-center text-sm font-semibold text-amber-600 mb-4">
              {labels[hover || rating]}
            </p>
          )}
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Laissez un commentaire (optionnel)…"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-4"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50"
            >Plus tard</button>
            <button onClick={handleSubmit} disabled={loading || !rating}
              className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-40 hover:bg-blue-700 transition"
            >{loading ? 'Envoi…' : 'Envoyer'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function TrackingPage() {
  const { user } = useAuthStore()

  const [orders,      setOrders]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [view,        setView]        = useState('list')
  const [selected,    setSelected]    = useState(null)
  const [step,        setStep]        = useState(0)
  const [activeCat,   setActiveCat]   = useState(null)
  const [activeItem,  setActiveItem]  = useState(null)
  const [cart,        setCart]        = useState({})
  const [form,        setForm]        = useState({ address: '', pickupAddress: '', note: '' })
  const [submitting,  setSubmitting]  = useState(false)
  const [cancelling,  setCancelling]  = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [ratingModal, setRatingModal] = useState(null)

  const allItems  = CATEGORIES.flatMap(c => c.items)
  const cartItems = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ ...allItems.find(i => i.id === id), qty }))
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const addItem    = (item) => setCart(c => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))
  const removeItem = (id)   => setCart(c => {
    const n = { ...c }
    if (n[id] > 1) { n[id]-- } else { delete n[id] }
    return n
  })

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/client/my-orders')
      setOrders(data)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    const iv = setInterval(loadOrders, 15000)
    return () => clearInterval(iv)
  }, [])

  const resetForm = () => {
    setCart({})
    setForm({ address: '', pickupAddress: '', note: '' })
    setStep(0); setActiveCat(null); setActiveItem(null)
    setError(''); setSuccess('')
  }

  const handleSubmit = async () => {
    if (!form.address.trim()) { setError('Adresse de livraison requise'); return }
    setError(''); setSubmitting(true)
    try {
      const items = cartItems.map(i => ({ name: i.name, qty: i.qty, price: i.price, photo: i.photo }))
      await api.post('/client/order', {
        address: form.address,
        pickupAddress: form.pickupAddress,
        note: form.note,
        items,
        latitude:  31.6295,
        longitude: -7.9811,
      })
      setSuccess('Commande passée avec succès !')
      await loadOrders()
      setTimeout(() => { resetForm(); setView('list') }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la commande')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (pointId) => {
    if (!window.confirm('Annuler cette commande ?')) return
    setCancelling(true)
    try {
      await api.patch(`/client/cancel/${pointId}`)
      await loadOrders()
      setView('list')
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'annulation")
    } finally {
      setCancelling(false)
    }
  }

  const handleRate = async (pointId, rating, comment) => {
    await api.post(`/client/rate/${pointId}`, { rating, comment })
    await loadOrders()
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'failed')
  const pastOrders   = orders.filter(o => o.status === 'delivered'  || o.status === 'failed')

  // ════════════════════════════════════════════════════
  // VUE COMMANDE
  // ════════════════════════════════════════════════════
  if (view === 'order') {

    // Détail article
    if (activeItem) {
      const cat = CATEGORIES.find(c => c.items.some(i => i.id === activeItem.id))
      const qty = cart[activeItem.id] || 0
      return (
        <div className="min-h-screen bg-white">
          <Navbar />
          <div className="max-w-lg mx-auto">
            <div className="relative h-64 overflow-hidden">
              <img src={activeItem.photo} alt={activeItem.name}
                className="w-full h-full object-cover"
                onError={e => { e.target.parentElement.style.background='#f3f4f6'; e.target.style.display='none' }}
              />
              <button onClick={() => setActiveItem(null)}
                className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center shadow-sm text-gray-700 font-bold text-lg"
              >←</button>
            </div>
            <div className="px-5 py-6">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{activeItem.name}</h2>
                <span className="text-xl font-bold mt-1" style={{ color: cat?.accent }}>{activeItem.price} MAD</span>
              </div>
              <p className="text-gray-500 mb-6">{activeItem.description}</p>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-semibold text-gray-600">Quantité</span>
                <div className="flex items-center gap-4 bg-gray-100 rounded-full px-4 py-2">
                  <button onClick={() => removeItem(activeItem.id)} className="w-7 h-7 flex items-center justify-center text-gray-700 font-bold text-xl">−</button>
                  <span className="text-lg font-bold min-w-[20px] text-center">{qty}</span>
                  <button onClick={() => addItem(activeItem)} className="w-7 h-7 flex items-center justify-center text-gray-700 font-bold text-xl">+</button>
                </div>
                {qty > 0 && <span className="text-sm text-gray-400">= {activeItem.price * qty} MAD</span>}
              </div>
              <button onClick={() => { addItem(activeItem); setActiveItem(null) }}
                className="w-full py-4 rounded-2xl text-white font-bold text-base"
                style={{ background: cat?.accent || '#1a1a1a' }}
              >Ajouter au panier</button>
            </div>
          </div>
        </div>
      )
    }

    // Étapes commande
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">

          {/* Barre progression */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                if (step === 1) { setStep(0); setActiveCat(null) }
                else if (step > 1) { setStep(s => s - 1) }
                else { resetForm(); setView('list') }
              }}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium"
            >← {step > 0 ? 'Retour' : 'Annuler'}</button>
            <div className="flex-1 flex gap-1.5">
              {[1,2,3,4].map(s => (
                <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= Math.min(step+1,4) ? 'bg-blue-600' : 'bg-gray-200'}`}/>
              ))}
            </div>
            <span className="text-xs text-gray-400">{Math.min(step+1,4)}/4</span>
          </div>

          {/* Étape 0 — Catégories */}
          {step === 0 && (
            <div>
              <h1 className="text-xl font-bold text-gray-800 mb-1">Que voulez-vous livrer ?</h1>
              <p className="text-sm text-gray-400 mb-5">Choisissez une catégorie</p>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setActiveCat(cat); setStep(1) }}
                    className="relative rounded-2xl overflow-hidden h-36 text-left shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img src={cat.photo} alt={cat.label}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={e => { e.target.style.display='none'; e.target.parentElement.style.background='#e5e7eb' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="text-white font-bold text-base">{cat.label}</div>
                      <div className="text-white/70 text-xs mt-0.5">{cat.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 1 — Articles */}
          {step === 1 && activeCat && (
            <div>
              <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-800">{activeCat.label}</h1>
                <p className="text-sm text-gray-400">{activeCat.subtitle}</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCat(cat)}
                    className={`shrink-0 text-sm font-semibold px-4 py-1.5 rounded-full border transition ${activeCat.id===cat.id?'text-white border-transparent':'bg-white text-gray-600 border-gray-200'}`}
                    style={activeCat.id===cat.id?{background:activeCat.accent}:{}}
                  >{cat.label}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {activeCat.items.map(item => {
                  const qty = cart[item.id] || 0
                  return (
                    <div key={item.id}
                      className={`bg-white rounded-2xl overflow-hidden border-2 transition ${qty>0?'shadow-md':'border-gray-100'}`}
                      style={{ borderColor: qty>0?activeCat.accent:undefined }}
                    >
                      <div className="relative h-28 overflow-hidden cursor-pointer" onClick={() => setActiveItem(item)}>
                        <img src={item.photo} alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={e => { e.target.parentElement.style.background='#f9fafb'; e.target.style.display='none' }}
                        />
                        {qty > 0 && (
                          <div className="absolute top-2 right-2 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: activeCat.accent }}
                          >{qty}</div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-gray-800 truncate mb-0.5 cursor-pointer" onClick={() => setActiveItem(item)}>{item.name}</p>
                        <p className="text-xs text-gray-400 mb-2 truncate">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold" style={{ color: activeCat.accent }}>{item.price} MAD</span>
                          {qty === 0 ? (
                            <button onClick={() => addItem(item)}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xl font-bold"
                              style={{ background: activeCat.accent }}
                            >+</button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded-full border flex items-center justify-center text-gray-600 font-bold" style={{ borderColor: activeCat.accent }}>−</button>
                              <span className="text-sm font-bold w-4 text-center" style={{ color: activeCat.accent }}>{qty}</span>
                              <button onClick={() => addItem(item)} className="w-6 h-6 rounded-full text-white flex items-center justify-center font-bold" style={{ background: activeCat.accent }}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {cartCount > 0 && (
                <button onClick={() => setStep(2)}
                  className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold flex items-center justify-between px-6 shadow-lg"
                >
                  <span>{cartCount} article{cartCount>1?'s':''}</span>
                  <span>{cartTotal} MAD →</span>
                </button>
              )}
            </div>
          )}

          {/* Étape 2 — Adresses */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-bold text-gray-800 mb-5">Où livrer ?</h1>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Adresse de récupération</label>
                  <input type="text" value={form.pickupAddress} onChange={e => setForm({...form,pickupAddress:e.target.value})}
                    placeholder="Ex: Marché central…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Adresse de livraison *</label>
                  <input type="text" value={form.address} onChange={e => setForm({...form,address:e.target.value})}
                    placeholder="Ex: 12 Rue Mohammed V, Marrakech"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Instructions</label>
                  <textarea value={form.note} onChange={e => setForm({...form,note:e.target.value})}
                    placeholder="Ex: Sonnez 2 fois, 1er étage…" rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
              </div>
              <button onClick={() => { if (!form.address.trim()) { setError('Adresse requise'); return }; setError(''); setStep(3) }}
                className="w-full mt-6 bg-blue-600 text-white rounded-2xl py-4 font-bold"
              >Continuer →</button>
            </div>
          )}

          {/* Étape 3 — Résumé */}
          {step === 3 && (
            <div>
              <h1 className="text-xl font-bold text-gray-800 mb-5">Résumé de commande</h1>
              {error   && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-3">{error}</div>}
              {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-3 font-medium">{success}</div>}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
                {cartItems.map((item, idx) => (
                  <div key={item.id} className={`flex items-center gap-3 p-4 ${idx<cartItems.length-1?'border-b border-gray-50':''}`}>
                    <img src={item.photo} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" onError={e=>{e.target.style.display='none'}}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.qty} × {item.price} MAD</p>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{item.price*item.qty} MAD</span>
                  </div>
                ))}
                <div className="px-4 py-3 bg-gray-50 flex justify-between border-t border-gray-100">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-bold text-blue-600 text-lg">{cartTotal} MAD</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 space-y-3 text-sm">
                <div className="flex gap-3"><span>📍</span><div><p className="text-xs text-gray-400">Récupéré chez</p><p className="font-medium">{form.pickupAddress||'Entrepôt central'}</p></div></div>
                <div className="flex gap-3"><span>🏠</span><div><p className="text-xs text-gray-400">Livré à</p><p className="font-medium">{form.address}</p></div></div>
                <div className="flex gap-3"><span>👤</span><div><p className="text-xs text-gray-400">Destinataire</p><p className="font-medium">{user?.name} · {user?.phone}</p></div></div>
                <div className="flex gap-3"><span>🕐</span><div><p className="text-xs text-gray-400">Délai estimé</p><p className="font-medium">Aujourd'hui · 30–60 min</p></div></div>
              </div>
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Envoi…</>
                  : `Confirmer · ${cartTotal} MAD`
                }
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Paiement à la livraison</p>
            </div>
          )}

        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════
  // VUE DÉTAIL COMMANDE
  // ════════════════════════════════════════════════════
  if (view === 'detail' && selected) {
    const info    = STATUS_INFO[selected.status] || STATUS_INFO['pending']
    const stepIdx = STEPS.findIndex(s => s.key === selected.status)
    const items   = typeof selected.items === 'string' ? JSON.parse(selected.items||'[]') : (selected.items||[])
    const driver    = selected.DeliveryOrder?.Driver
    const canCancel = selected.status === 'pending'
    const canRate   = selected.status === 'delivered' && !selected.rating

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {ratingModal && (
          <RatingModal
            pointId={ratingModal.pointId}
            driverName={ratingModal.driverName}
            onClose={() => setRatingModal(null)}
            onSubmit={handleRate}
          />
        )}
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-800">← Mes commandes</button>

          {/* Statut */}
          <div className={`rounded-2xl border px-5 py-4 ${info.color}`}>
            <StatusBadge status={selected.status}/>
            <p className="text-sm mt-2">{info.msg}</p>
          </div>

          {/* Annuler */}
          {canCancel && (
            <div className="bg-white rounded-2xl border border-red-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Annuler la commande</p>
                  <p className="text-xs text-gray-400 mt-0.5">Possible uniquement avant que le livreur démarre</p>
                </div>
                <button onClick={() => handleCancel(selected.id)} disabled={cancelling}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold px-4 py-2 rounded-xl transition disabled:opacity-40"
                >{cancelling?'…':'✕ Annuler'}</button>
              </div>
            </div>
          )}

          {/* Noter */}
          {canRate && (
            <button onClick={() => setRatingModal({ pointId: selected.id, driverName: driver?.name||'le livreur' })}
              className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-amber-100 transition"
            >
              <div className="text-left">
                <p className="text-sm font-bold text-amber-800">Évaluer votre livraison</p>
                <p className="text-xs text-amber-600 mt-0.5">Notez l'expérience avec {driver?.name||'votre livreur'}</p>
              </div>
              <div className="text-2xl">⭐</div>
            </button>
          )}

          {/* Note existante */}
          {selected.rating && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
              <p className="text-sm font-bold text-amber-800 mb-1">Votre évaluation</p>
              <div className="flex gap-0.5 mb-1">
                {[1,2,3,4,5].map(s=>(
                  <span key={s} className="text-xl" style={{ color: s<=selected.rating?'#F59E0B':'#E5E7EB' }}>★</span>
                ))}
              </div>
              {selected.ratingComment && <p className="text-xs text-amber-700 mt-1">"{selected.ratingComment}"</p>}
            </div>
          )}

          {/* Progression */}
          {selected.status !== 'failed' && (
            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-100 z-0"/>
                <div className="absolute left-0 top-5 h-0.5 bg-blue-500 z-0 transition-all"
                  style={{ width: stepIdx===0?'0%':stepIdx===1?'50%':'100%' }}
                />
                {STEPS.map((s,i)=>(
                  <div key={s.key} className="flex flex-col items-center gap-2 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${i<=stepIdx?'bg-blue-600 border-blue-600':'bg-white border-gray-200'}`}>{s.icon}</div>
                    <span className={`text-xs font-semibold ${i<=stepIdx?'text-blue-600':'text-gray-300'}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CARTE GPS LIVE (fix Leaflet intégré) ── */}
          {selected.status === 'in_progress' && driver && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <LiveMap
                driverId={driver.id}
                destLat={selected.latitude}
                destLng={selected.longitude}
                destLabel={selected.address}
              />
            </div>
          )}

          {/* Articles */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <h2 className="text-sm font-bold text-gray-700 px-5 pt-4 pb-2">Articles commandés</h2>
              {items.map((item,i)=>(
                <div key={i} className={`flex items-center gap-3 px-5 py-3 ${i<items.length-1?'border-b border-gray-50':''}`}>
                  {item.photo && <img src={item.photo} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={e=>{e.target.style.display='none'}}/>}
                  <div className="flex-1"><span className="text-sm font-medium text-gray-700">{item.name} × {item.qty}</span></div>
                  <span className="text-sm font-bold text-blue-600">{item.price*item.qty} MAD</span>
                </div>
              ))}
              {selected.totalPrice && (
                <div className="px-5 py-3 bg-gray-50 flex justify-between border-t border-gray-100">
                  <span className="font-bold text-sm">Total</span>
                  <span className="font-bold text-blue-600">{selected.totalPrice} MAD</span>
                </div>
              )}
            </div>
          )}

          {/* Détails adresse */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 text-sm">
            <h2 className="font-bold text-gray-700">Détails</h2>
            <div className="flex gap-3"><span>🏠</span><div><p className="text-xs text-gray-400">Adresse</p><p className="font-medium">{selected.address}</p></div></div>
            {selected.pickupAddress && (
              <div className="flex gap-3"><span>📍</span><div><p className="text-xs text-gray-400">Récupéré chez</p><p className="font-medium">{selected.pickupAddress}</p></div></div>
            )}
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
                <a href={`tel:${driver.phone}`} className="bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl">📞 Appeler</a>
              </div>
            </div>
          )}

        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════
  // VUE LISTE
  // ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mes commandes</h1>
            <p className="text-sm text-gray-400">Bonjour, {user?.name?.split(' ')[0]} 👋</p>
          </div>
          <button onClick={() => { resetForm(); setView('order') }}
            className="bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition"
          >+ Commander</button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {activeOrders.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">En cours</h2>
                <div className="space-y-3">
                  {activeOrders.map(order => {
                    const stepIdx = STEPS.findIndex(s => s.key === order.status)
                    const items   = typeof order.items==='string' ? JSON.parse(order.items||'[]') : (order.items||[])
                    return (
                      <button key={order.id} onClick={() => { setSelected(order); setView('detail') }}
                        className="w-full bg-white rounded-2xl border-2 border-blue-100 p-4 text-left hover:border-blue-300 transition"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
                          <StatusBadge status={order.status}/>
                          {order.status==='in_progress' && <span className="text-xs text-blue-600 font-medium ml-1">🚴 En route</span>}
                          {order.status==='pending'     && <span className="text-xs text-orange-500 font-medium ml-1">Annulable</span>}
                          <span className="ml-auto text-gray-300">›</span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          {items.slice(0,4).map((item,i) => item.photo
                            ? <img key={i} src={item.photo} alt={item.name} className="w-10 h-10 rounded-lg object-cover" onError={e=>{e.target.style.display='none'}}/>
                            : null
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">🏠 {order.address}</p>
                        {order.totalPrice && <p className="text-sm font-bold text-blue-600 mt-1">{order.totalPrice} MAD</p>}
                        <div className="flex gap-1.5 mt-3">
                          {STEPS.map((s,i)=>(
                            <div key={s.key} className={`h-1.5 flex-1 rounded-full ${i<=stepIdx?'bg-blue-500':'bg-gray-100'}`}/>
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
                  {pastOrders.map(order => {
                    const items    = typeof order.items==='string' ? JSON.parse(order.items||'[]') : (order.items||[])
                    const hasRated = order.rating
                    return (
                      <button key={order.id} onClick={() => { setSelected(order); setView('detail') }}
                        className="w-full bg-white rounded-xl border border-gray-100 p-4 text-left flex items-center gap-3 hover:bg-gray-50"
                      >
                        <div className="flex gap-1">
                          {items.slice(0,3).map((item,i) => item.photo
                            ? <img key={i} src={item.photo} alt={item.name} className="w-10 h-10 rounded-lg object-cover" onError={e=>{e.target.style.display='none'}}/>
                            : null
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{order.address}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {order.totalPrice && <p className="text-xs text-gray-400">{order.totalPrice} MAD</p>}
                            {order.status==='delivered' && !hasRated && <span className="text-xs text-amber-500 font-semibold">⭐ À noter</span>}
                            {hasRated && <span className="text-xs text-amber-500">{'★'.repeat(order.rating)}{'☆'.repeat(5-order.rating)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={order.status}/>
                          <span className="text-gray-300">›</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {orders.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-lg font-bold text-gray-700 mb-2">Aucune commande</h2>
                <button onClick={() => { resetForm(); setView('order') }}
                  className="bg-blue-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-blue-700"
                >Commander maintenant</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
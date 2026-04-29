import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, Image, TextInput, ActivityIndicator,
  Alert, Linking, RefreshControl,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import api from '../api/api'
import useAuthStore from '../store/authStore'
import StatusBadge from '../components/StatusBadge'

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

// ─── Données catalogue ────────────────────────────────────────────────────────
const STEPS = [
  { key: 'pending',     label: 'Confirmee' },
  { key: 'in_progress', label: 'En route'  },
  { key: 'delivered',   label: 'Livree'    },
]

const STATUS_INFO = {
  pending:     { msg: 'Commande confirmee. Un livreur va prendre en charge votre colis.' },
  in_progress: { msg: 'Votre livreur est en route. Suivez-le sur la carte ci-dessous.' },
  delivered:   { msg: 'Livraison effectuee avec succes. Merci de votre confiance !' },
  failed:      { msg: 'La livraison a echoue ou a ete annulee.' },
}

const CATEGORIES = [
  {
    id: 'cafe', label: 'Cafe', subtitle: 'Boissons chaudes & froides', accent: '#6F4E37',
    photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop',
    items: [
      { id: 'c1', name: 'Cafe Marocain',     description: 'Cardamome & cannelle',         price: 8,  photo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop' },
      { id: 'c2', name: 'Cappuccino',         description: 'Mousse de lait veloutee',      price: 15, photo: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop' },
      { id: 'c3', name: "Jus d'orange frais", description: 'Presse minute, 100% naturel', price: 12, photo: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop' },
      { id: 'c4', name: 'The a la menthe',    description: 'Gunpowder & menthe fraiche',  price: 10, photo: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop' },
      { id: 'c5', name: 'Smoothie fruits',    description: 'Fraise, banane & mangue',     price: 18, photo: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop' },
      { id: 'c6', name: 'Cafe Glace',         description: 'Double espresso sur glace',   price: 20, photo: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: 'resto', label: 'Restaurants', subtitle: 'Plats locaux & internationaux', accent: '#C0392B',
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    items: [
      { id: 'r1', name: 'Pizza Margherita', description: 'Tomate, mozzarella, basilic', price: 55, photo: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop' },
      { id: 'r2', name: 'Couscous royal',   description: 'Agneau, merguez, legumes',   price: 70, photo: 'https://images.unsplash.com/photo-1628294896516-3c88dc6b07af?w=400&h=300&fit=crop' },
      { id: 'r3', name: 'Tajine poulet',    description: 'Citron confit & olives',     price: 65, photo: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop' },
      { id: 'r4', name: 'Burger classique', description: 'Steak hache, cheddar',       price: 50, photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop' },
      { id: 'r5', name: 'Pastilla poulet',  description: 'Feuillte sucre-sale',        price: 45, photo: 'https://images.unsplash.com/photo-1621501103258-9253c3a5e358?w=400&h=300&fit=crop' },
      { id: 'r6', name: 'Salade nicoise',   description: 'Thon, oeuf, olives',         price: 35, photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: 'shop', label: 'Shopping', subtitle: 'Colis, courses & cadeaux', accent: '#1A5276',
    photo: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop',
    items: [
      { id: 's1', name: 'Colis standard',      description: "Jusqu'a 5 kg",          price: 15, photo: 'https://images.unsplash.com/photo-1595079676601-f1adf5be5dee?w=400&h=300&fit=crop' },
      { id: 's2', name: 'Colis express',        description: 'Livraison en < 1h',     price: 30, photo: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=300&fit=crop' },
      { id: 's3', name: 'Documents',            description: 'Enveloppes, contrats',  price: 10, photo: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&h=300&fit=crop' },
      { id: 's4', name: 'Courses alimentaires', description: 'Supermarche, epicerie', price: 20, photo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop' },
      { id: 's5', name: 'Fleurs & Cadeaux',     description: 'Bouquets, coffrets',    price: 25, photo: 'https://images.unsplash.com/photo-1487530811015-780f2f08b77a?w=400&h=300&fit=crop' },
      { id: 's6', name: 'Electronique',         description: 'Fragile, assure',       price: 35, photo: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: 'pharma', label: 'Pharmacie', subtitle: 'Medicaments & soins', accent: '#1D6A3A',
    photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
    items: [
      { id: 'p1', name: 'Medicaments ordonnance',  description: 'Sur ordonnance valide',    price: 12, photo: 'https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=400&h=300&fit=crop' },
      { id: 'p2', name: 'Paracetamol 500mg',       description: 'Boite de 20 comprimes',   price: 8,  photo: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=300&fit=crop' },
      { id: 'p3', name: 'Creme solaire SPF50+',    description: '150ml, resistant eau',    price: 45, photo: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop' },
      { id: 'p4', name: 'Vitamines & complements', description: 'Vit C, D, magnesium',    price: 35, photo: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=400&h=300&fit=crop' },
      { id: 'p5', name: 'Masques FFP2',            description: 'Boite de 10',             price: 15, photo: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&fit=crop' },
      { id: 'p6', name: 'Thermometre digital',     description: 'Resultat en 10 secondes', price: 60, photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop' },
    ],
  },
]

const ALL_ITEMS = CATEGORIES.flatMap(c => c.items)

// ─── RatingModal ──────────────────────────────────────────────────────────────
function RatingModal({ pointId, driverName, onClose, onSubmit }) {
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const labels = { 1: 'Tres mauvais', 2: 'Mauvais', 3: 'Correct', 4: 'Bien', 5: 'Excellent !' }

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={rStyles.overlay}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={rStyles.overlayBg} />
      </TouchableWithoutFeedback>

      <View style={rStyles.modal}>
        <View style={rStyles.modalHandle} />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={rStyles.modalHeader}>
            <Text style={rStyles.modalTitle}>Evaluer la livraison</Text>
            <Text style={rStyles.modalSub}>
              Comment s'est passee votre livraison avec {driverName} ?
            </Text>
          </View>

          <View style={rStyles.modalBody}>
            {/* Etoiles */}
            <View style={rStyles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={rStyles.starBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[rStyles.starText, { color: star <= rating ? '#F59E0B' : C.border }]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {rating > 0 && (
              <Text style={rStyles.ratingLabel}>{labels[rating]}</Text>
            )}

            {/* Champ commentaire — toujours visible au-dessus du clavier */}
            <Text style={rStyles.commentLabel}>COMMENTAIRE (OPTIONNEL)</Text>
            <TextInput
              style={rStyles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Decrivez votre experience..."
              placeholderTextColor={C.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit
            />

            {!!error && <Text style={rStyles.errorText}>{error}</Text>}

            <View style={rStyles.modalBtns}>
              <TouchableOpacity style={rStyles.cancelBtn} onPress={onClose}>
                <Text style={rStyles.cancelBtnText}>Plus tard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[rStyles.submitBtn, (!rating || loading) && { opacity: 0.4 }]}
                onPress={handleSubmit}
                disabled={!rating || loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={rStyles.submitBtnText}>Envoyer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Sous-composant info row ──────────────────────────────────────────────────
function InfoRowDetail({ label, value }) {
  return (
    <View style={styles.infoRowD}>
      <Text style={styles.infoLabelD}>{label}</Text>
      <Text style={styles.infoValueD}>{value}</Text>
    </View>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ClientTrackingScreen({ navigation }) {
  const { user } = useAuthStore()

  const [view,       setView]       = useState('list')
  const [orders,     setOrders]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected,   setSelected]   = useState(null)
  const [driverPos,  setDriverPos]  = useState(null)

  const [step,       setStep]       = useState(0)
  const [activeCat,  setActiveCat]  = useState(null)
  const [activeItem, setActiveItem] = useState(null)
  const [cart,       setCart]       = useState({})
  const [form,       setForm]       = useState({ address: '', pickupAddress: '', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')

  const [ratingModal, setRatingModal] = useState(null)

  const posInterval = useRef(null)
  const autoRefresh = useRef(null)

  // Panier
  const cartItems = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ ...ALL_ITEMS.find(i => i.id === id), qty }))
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const addItem    = (item) => setCart(c => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))
  const removeItem = (id)   => setCart(c => {
    const n = { ...c }
    if (n[id] > 1) n[id]--
    else delete n[id]
    return n
  })

  const handleLogout = async () => {
    Alert.alert('Deconnexion', 'Voulez-vous vraiment vous deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Deconnecter', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'user', 'role'])
          navigation.replace('Login')
        },
      },
    ])
  }

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        Alert.alert('Session expiree', 'Veuillez vous reconnecter', [
          { text: 'OK', onPress: () => navigation.replace('Login') },
        ])
        return
      }
      loadOrders()
    }
    checkAuth()
  }, [])

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await api.get('/client/my-orders')
      setOrders(data || [])
    } catch (err) {
      if (err.response?.status === 401) {
        await AsyncStorage.multiRemove(['token', 'user', 'role'])
        navigation.replace('Login')
        return
      }
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigation])

  useEffect(() => {
    autoRefresh.current = setInterval(() => loadOrders(true), 15000)
    return () => clearInterval(autoRefresh.current)
  }, [loadOrders])

  useEffect(() => {
    clearInterval(posInterval.current)
    const driverId = selected?.driverAcceptedId
                  || selected?.DeliveryOrder?.driverId
                  || selected?.DeliveryOrder?.Driver?.id
    if (selected?.status === 'in_progress' && driverId) {
      const fetchPos = () =>
        api.get(`/tracking/position/${driverId}`)
          .then(r => { if (r.data?.latitude) setDriverPos({ latitude: r.data.latitude, longitude: r.data.longitude }) })
          .catch(() => {})
      fetchPos()
      posInterval.current = setInterval(fetchPos, 5000)
    } else {
      setDriverPos(null)
    }
    return () => clearInterval(posInterval.current)
  }, [selected])

  const resetForm = () => {
    setCart({})
    setForm({ address: '', pickupAddress: '', note: '' })
    setStep(0); setActiveCat(null); setActiveItem(null)
    setError(''); setSuccess('')
  }

  // ── Geocodage : adresse texte → coordonnees GPS reelles ──────────────────
  // Utilise Nominatim (OpenStreetMap) — gratuit, sans cle API
  const geocodeAddress = async (address) => {
    try {
      const query = encodeURIComponent(address.trim() + ', Marrakech, Maroc')
      const res   = await fetch(
        'https://nominatim.openstreetmap.org/search?q=' + query + '&format=json&limit=1',
        { headers: { 'Accept-Language': 'fr', 'User-Agent': 'DelivTrack/1.0' } }
      )
      const data = await res.json()
      if (data && data.length > 0) {
        return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }
      }
    } catch (e) {
      console.warn('Geocodage echoue:', e.message)
    }
    return { latitude: 31.6295, longitude: -7.9811 } // Fallback centre Marrakech
  }

  const handleSubmit = async () => {
    if (!form.address.trim()) { setError('Adresse de livraison requise'); return }
    const token = await AsyncStorage.getItem('token')
    if (!token) { setError("Vous n'etes pas connecte."); setTimeout(() => navigation.replace('Login'), 2000); return }
    setError(''); setSubmitting(true)
    try {
      const items = cartItems.map(i => ({ name: i.name, qty: i.qty, price: i.price, photo: i.photo }))

      // Geocodage de l'adresse pour avoir les vraies coordonnees GPS
      const coords = await geocodeAddress(form.address)

      await api.post('/client/order', {
        address: form.address, pickupAddress: form.pickupAddress,
        note: form.note, items,
        latitude:  coords.latitude,
        longitude: coords.longitude,
      })
      setSuccess('Commande passee avec succes !')
      await loadOrders(true)
      setTimeout(() => { resetForm(); setView('list') }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la commande')
    } finally { setSubmitting(false) }
  }

  const handleCancel = (pointId) => {
    Alert.alert('Annuler la commande', 'Voulez-vous vraiment annuler cette commande ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler', style: 'destructive',
        onPress: async () => {
          setCancelling(true)
          try {
            await api.patch(`/client/cancel/${pointId}`)
            await loadOrders(true)
            setView('list')
          } catch (err) {
            Alert.alert('Erreur', err.response?.data?.error || "Erreur lors de l'annulation")
          } finally { setCancelling(false) }
        },
      },
    ])
  }

  const handleRate = async (pointId, rating, comment) => {
    await api.post(`/client/rate/${pointId}`, { rating, comment })
    await loadOrders(true)
    setSelected(prev => prev ? { ...prev, rating, ratingComment: comment } : prev)
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'failed')
  const pastOrders   = orders.filter(o => o.status === 'delivered'  || o.status === 'failed')
  const parseItems   = raw => Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw || '[]') : [])

  // ════════════════════════════════════════════════════════════════════════════
  // VUE COMMANDE
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'order') {
    const progressPct = ((step + 1) / 4) * 100

    if (activeItem) {
      const cat = CATEGORIES.find(c => c.items.some(i => i.id === activeItem.id))
      const qty = cart[activeItem.id] || 0
      return (
        <View style={styles.root}>
          <Image source={{ uri: activeItem.photo }} style={styles.detailPhoto} />
          <TouchableOpacity style={styles.detailBack} onPress={() => setActiveItem(null)}>
            <Text style={styles.detailBackText}>←</Text>
          </TouchableOpacity>
          <ScrollView style={styles.detailBody}>
            <View style={styles.detailInfo}>
              <Text style={styles.detailName}>{activeItem.name}</Text>
              <Text style={[styles.detailPrice, { color: cat?.accent || C.brand }]}>{activeItem.price} MAD</Text>
            </View>
            <Text style={styles.detailDesc}>{activeItem.description}</Text>
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantite</Text>
              <View style={styles.qtyControl}>
                <TouchableOpacity onPress={() => removeItem(activeItem.id)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{qty}</Text>
                <TouchableOpacity onPress={() => addItem(activeItem)} style={[styles.qtyBtn, styles.qtyBtnPlus]}>
                  <Text style={[styles.qtyBtnText, { color: '#fff' }]}>+</Text>
                </TouchableOpacity>
              </View>
              {qty > 0 && <Text style={styles.qtyTotal}>{activeItem.price * qty} MAD</Text>}
            </View>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: cat?.accent || C.brand }]}
              onPress={() => { addItem(activeItem); setActiveItem(null) }}
            >
              <Text style={styles.addBtnText}>Ajouter au panier</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )
    }

    return (
      <View style={styles.root}>
        {/* Order header */}
        <View style={styles.orderHeader}>
          <TouchableOpacity onPress={() => {
            if (step === 1) { setStep(0); setActiveCat(null) }
            else if (step > 1) setStep(s => s - 1)
            else { resetForm(); setView('list') }
          }}>
            <Text style={styles.backLink}>{step > 0 ? '← Retour' : '← Annuler'}</Text>
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{step + 1}/4</Text>
        </View>

        <ScrollView style={styles.orderScroll} contentContainerStyle={styles.orderContent}>

          {/* STEP 0 : Categories */}
          {step === 0 && (
            <>
              <Text style={styles.stepTitle}>Que voulez-vous livrer ?</Text>
              <Text style={styles.stepSub}>Choisissez une categorie</Text>
              <View style={styles.catsGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.catCard}
                    onPress={() => { setActiveCat(cat); setStep(1) }}
                  >
                    <Image source={{ uri: cat.photo }} style={styles.catPhoto} />
                    <View style={styles.catOverlay} />
                    <View style={styles.catTextBox}>
                      <Text style={styles.catLabel}>{cat.label}</Text>
                      <Text style={styles.catSub}>{cat.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* STEP 1 : Articles */}
          {step === 1 && activeCat && (
            <>
              <Text style={styles.stepTitle}>{activeCat.label}</Text>
              <Text style={styles.stepSub}>{activeCat.subtitle}</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTabs}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setActiveCat(cat)}
                    style={[styles.catTab, activeCat.id === cat.id && { backgroundColor: C.brand, borderColor: C.brand }]}
                  >
                    <Text style={[styles.catTabText, activeCat.id === cat.id && { color: '#fff' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.itemsGrid}>
                {activeCat.items.map(item => {
                  const qty = cart[item.id] || 0
                  return (
                    <View key={item.id} style={[styles.itemCard, qty > 0 && { borderColor: C.brand, borderWidth: 2 }]}>
                      <TouchableOpacity onPress={() => setActiveItem(item)}>
                        <Image source={{ uri: item.photo }} style={styles.itemPhoto} />
                        {qty > 0 && (
                          <View style={[styles.itemQtyBadge, { backgroundColor: C.brand }]}>
                            <Text style={styles.itemQtyBadgeText}>{qty}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <View style={styles.itemInfo}>
                        <TouchableOpacity onPress={() => setActiveItem(item)}>
                          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                        </TouchableOpacity>
                        <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                        <View style={styles.itemFooter}>
                          <Text style={[styles.itemPrice, { color: C.brand }]}>{item.price} MAD</Text>
                          {qty === 0 ? (
                            <TouchableOpacity onPress={() => addItem(item)} style={styles.addSmBtn}>
                              <Text style={styles.addSmBtnText}>+</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.qtyMini}>
                              <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.qtyMiniBtn}>
                                <Text style={styles.qtyMiniBtnText}>-</Text>
                              </TouchableOpacity>
                              <Text style={styles.qtyMiniVal}>{qty}</Text>
                              <TouchableOpacity onPress={() => addItem(item)} style={[styles.qtyMiniBtn, styles.qtyMiniBtnPlus]}>
                                <Text style={[styles.qtyMiniBtnText, { color: '#fff' }]}>+</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>

              {cartCount > 0 && (
                <TouchableOpacity style={styles.cartBar} onPress={() => setStep(2)}>
                  <Text style={styles.cartBarLeft}>{cartCount} article{cartCount > 1 ? 's' : ''}</Text>
                  <Text style={styles.cartBarRight}>{cartTotal} MAD →</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* STEP 2 : Adresse */}
          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Ou livrer ?</Text>
              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ADRESSE DE RECUPERATION</Text>
                <TextInput
                  style={styles.input}
                  value={form.pickupAddress}
                  onChangeText={v => setForm(f => ({ ...f, pickupAddress: v }))}
                  placeholder="Ex: Marche central..."
                  placeholderTextColor={C.textSecondary}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ADRESSE DE LIVRAISON *</Text>
                <TextInput
                  style={styles.input}
                  value={form.address}
                  onChangeText={v => setForm(f => ({ ...f, address: v }))}
                  placeholder="Ex: 12 Rue Mohammed V, Marrakech"
                  placeholderTextColor={C.textSecondary}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>INSTRUCTIONS</Text>
                <TextInput
                  style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                  value={form.note}
                  onChangeText={v => setForm(f => ({ ...f, note: v }))}
                  placeholder="Ex: Sonnez 2 fois, 1er etage..."
                  placeholderTextColor={C.textSecondary}
                  multiline
                />
              </View>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() => {
                  if (!form.address.trim()) { setError('Adresse requise'); return }
                  setError(''); setStep(3)
                }}
              >
                <Text style={styles.nextBtnText}>Continuer</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 3 : Résumé */}
          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Resume de commande</Text>
              {!!error   && <Text style={styles.errorText}>{error}</Text>}
              {!!success && <Text style={styles.successText}>{success}</Text>}

              <View style={styles.summaryCard}>
                {cartItems.map((item, idx) => (
                  <View key={item.id} style={[styles.summaryRow, idx < cartItems.length - 1 && styles.summaryRowBorder]}>
                    <Image source={{ uri: item.photo }} style={styles.summaryThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.summaryName}>{item.name}</Text>
                      <Text style={styles.summaryQty}>{item.qty} x {item.price} MAD</Text>
                    </View>
                    <Text style={styles.summaryPrice}>{item.price * item.qty} MAD</Text>
                  </View>
                ))}
                <View style={styles.summaryTotal}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalVal}>{cartTotal} MAD</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                {[
                  { l: 'Recupere chez', v: form.pickupAddress || 'Entrepot central' },
                  { l: 'Livre a',       v: form.address },
                  { l: 'Destinataire',  v: `${user?.name} · ${user?.phone}` },
                  { l: 'Delai estime',  v: "Aujourd'hui · 30-60 min" },
                ].map((r, i) => (
                  <View key={i} style={styles.summaryInfoRow}>
                    <Text style={styles.summaryInfoLabel}>{r.l}</Text>
                    <Text style={styles.summaryInfoVal}>{r.v}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.confirmBtn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.confirmBtnText}>Confirmer · {cartTotal} MAD</Text>
                }
              </TouchableOpacity>
              <Text style={styles.payNote}>Paiement a la livraison</Text>
            </>
          )}
        </ScrollView>
      </View>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VUE DETAIL COMMANDE
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'detail' && selected) {
    const info    = STATUS_INFO[selected.status] || STATUS_INFO.pending
    const stepIdx = STEPS.findIndex(s => s.key === selected.status)
    const items   = parseItems(selected.items)
    const driver  = selected.DeliveryOrder?.Driver

    const canCancel    = selected.status === 'pending'
    const canRate      = selected.status === 'delivered' && !selected.rating
    const isInProgress = selected.status === 'in_progress'

    const statusColors = {
      pending:     { bg: '#FFFBEB', border: '#FDE68A' },
      in_progress: { bg: '#EFF6FF', border: '#BFDBFE' },
      delivered:   { bg: '#E8FBF0', border: '#B3EED0' },
      failed:      { bg: '#FEF2F2', border: '#FECACA' },
    }[selected.status] || { bg: C.bg, border: C.border }

    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {ratingModal && (
          <RatingModal
            pointId={ratingModal.pointId}
            driverName={ratingModal.driverName}
            onClose={() => setRatingModal(null)}
            onSubmit={handleRate}
          />
        )}

        <ScrollView
          style={styles.root}
          contentContainerStyle={{ paddingBottom: isInProgress && driver ? 100 : 40 }}
        >
          <View style={styles.detailTopBar}>
            <TouchableOpacity onPress={() => setView('list')}>
              <Text style={styles.backLink}>← Mes commandes</Text>
            </TouchableOpacity>
          </View>

          {/* Status banner */}
          <View style={[styles.statusBanner, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
            <StatusBadge status={selected.status} />
            <Text style={styles.statusMsg}>{info.msg}</Text>
          </View>

          {canCancel && (
            <View style={styles.cancelCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cancelCardTitle}>Annuler la commande</Text>
                <Text style={styles.cancelCardSub}>Possible avant que le livreur demarre</Text>
              </View>
              <TouchableOpacity
                style={[styles.cancelActionBtn, cancelling && { opacity: 0.4 }]}
                onPress={() => handleCancel(selected.id)}
                disabled={cancelling}
              >
                <Text style={styles.cancelActionBtnText}>{cancelling ? '...' : 'Annuler'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {canRate && (
            <TouchableOpacity
              style={styles.rateCard}
              onPress={() => setRatingModal({ pointId: selected.id, driverName: driver?.name || 'le livreur' })}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rateCardTitle}>Evaluer votre livraison</Text>
                <Text style={styles.rateCardSub}>Notez l'experience avec {driver?.name || 'votre livreur'}</Text>
              </View>
              <View style={styles.starIcon}>
                <Text style={styles.starIconText}>★</Text>
              </View>
            </TouchableOpacity>
          )}

          {!!selected.rating && (
            <View style={styles.ratingDisplay}>
              <Text style={styles.ratingDisplayTitle}>Votre evaluation</Text>
              <View style={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Text key={s} style={{ fontSize: 20, color: s <= selected.rating ? '#F59E0B' : C.border }}>★</Text>
                ))}
              </View>
              {!!selected.ratingComment && (
                <Text style={styles.ratingComment}>"{selected.ratingComment}"</Text>
              )}
            </View>
          )}

          {/* Progression */}
          {selected.status !== 'failed' && (
            <View style={styles.progressCard}>
              <View style={styles.progressTrack} />
              <View style={[
                styles.progressFillAbs,
                { width: stepIdx === 0 ? '0%' : stepIdx === 1 ? '50%' : '100%' },
              ]} />
              <View style={styles.stepsRow}>
                {STEPS.map((s, i) => (
                  <View key={s.key} style={styles.stepItem}>
                    <View style={[styles.stepDot, i <= stepIdx && styles.stepDotActive]}>
                      <Text style={[styles.stepNum, i <= stepIdx && { color: '#fff' }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepLabel, i <= stepIdx && styles.stepLabelActive]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* GPS map */}
          {selected.status === 'in_progress' && (
            <View style={styles.mapCard}>
              <View style={styles.mapCardHeader}>
                <View style={styles.liveGreen} />
                <Text style={styles.mapCardTitle}>Suivi GPS en direct</Text>
                {!driverPos && <Text style={styles.mapCardSub}>En attente...</Text>}
              </View>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={driverPos
                  ? { ...driverPos, latitudeDelta: 0.015, longitudeDelta: 0.015 }
                  : { latitude: 31.6295, longitude: -7.9811, latitudeDelta: 0.02, longitudeDelta: 0.02 }
                }
              >
                {driverPos && (
                  <Marker coordinate={driverPos} anchor={{ x: 0.5, y: 0.5 }}>
                    <View style={styles.driverMarkerOuter}>
                      <View style={styles.driverMarkerInner} />
                    </View>
                  </Marker>
                )}
                {selected.latitude && selected.longitude && (
                  <Marker coordinate={{ latitude: selected.latitude, longitude: selected.longitude }} pinColor={C.red} />
                )}
              </MapView>
              <Text style={styles.mapNote}>Position mise a jour toutes les 10 secondes</Text>
            </View>
          )}

          {/* Articles */}
          {items.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Articles commandes</Text>
              {items.map((item, i) => (
                <View key={i} style={[styles.itemRow2, i < items.length - 1 && styles.itemRow2Border]}>
                  {item.photo && <Image source={{ uri: item.photo }} style={styles.itemThumb2} />}
                  <Text style={styles.itemRow2Name}>{item.name} x{item.qty}</Text>
                  <Text style={styles.itemRow2Price}>{item.price * item.qty} MAD</Text>
                </View>
              ))}
              {selected.totalPrice && (
                <View style={[styles.itemRow2, { borderTopWidth: 1.5, borderTopColor: C.border, marginTop: 4, paddingTop: 12 }]}>
                  <Text style={[styles.itemRow2Name, { fontWeight: '800' }]}>Total</Text>
                  <Text style={[styles.itemRow2Price, { fontSize: 16 }]}>{selected.totalPrice} MAD</Text>
                </View>
              )}
            </View>
          )}

          {/* Adresse */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Details</Text>
            <InfoRowDetail label="Adresse" value={selected.address} />
            {selected.pickupAddress && (
              <InfoRowDetail label="Recupere chez" value={selected.pickupAddress} />
            )}
          </View>

          {/* Driver (scroll) - if not in progress */}
          {driver && !isInProgress && (
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitials}>
                  {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.driverVehicle}>{driver.vehicle}</Text>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${driver.phone}`)}>
                <Text style={styles.callBtnText}>Appeler</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Driver sticky - if in progress */}
        {isInProgress && driver && (
          <View style={styles.driverCardSticky}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>
                {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverVehicle}>{driver.vehicle || 'Moto'}</Text>
            </View>
            <TouchableOpacity style={styles.callBtnLarge} onPress={() => Linking.openURL(`tel:${driver.phone}`)}>
              <Text style={styles.callBtnLargeText}>Appeler</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VUE LISTE
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      <FlatList
        data={[]}
        renderItem={null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadOrders() }}
            colors={[C.brand]}
          />
        }
        ListHeaderComponent={(
          <View>
            {/* Header */}
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.listGreet}>Bonjour, {user?.name?.split(' ')[0] || 'Client'}</Text>
                <Text style={styles.listTitle}>Mes commandes</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
                  <Text style={styles.iconBtnText}>✕</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.orderNowBtn} onPress={() => { resetForm(); setView('order') }}>
                  <Text style={styles.orderNowText}>+ Commander</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={C.brand} style={{ marginTop: 60 }} />
            ) : orders.length === 0 ? (
              <View style={styles.emptyList}>
                <View style={styles.emptyCircle} />
                <Text style={styles.emptyTitle}>Aucune commande</Text>
                <TouchableOpacity style={styles.orderNowBtn} onPress={() => { resetForm(); setView('order') }}>
                  <Text style={styles.orderNowText}>Commander maintenant</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {activeOrders.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionRow}>
                      <Text style={styles.sectionLabel}>EN COURS</Text>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeTxt}>{activeOrders.length}</Text>
                      </View>
                    </View>
                    {activeOrders.map(order => {
                      const stepIdx = STEPS.findIndex(s => s.key === order.status)
                      const items   = parseItems(order.items)
                      return (
                        <TouchableOpacity
                          key={`active_${order.id}`}
                          style={styles.activeOrderCard}
                          onPress={() => { setSelected(order); setView('detail') }}
                        >
                          <View style={styles.activeOrderTop}>
                            <View style={styles.pulseDot} />
                            <StatusBadge status={order.status} />
                            {order.status === 'in_progress' && (
                              <Text style={styles.enRouteText}>En route</Text>
                            )}
                            {order.status === 'pending' && (
                              <Text style={styles.annulableText}>Annulable</Text>
                            )}
                            <Text style={styles.chevron}>›</Text>
                          </View>
                          <View style={styles.thumbsRow}>
                            {items.slice(0, 4).map((item, i) =>
                              item.photo
                                ? <Image key={i} source={{ uri: item.photo }} style={styles.orderThumb} />
                                : null
                            )}
                          </View>
                          <Text style={styles.orderAddr} numberOfLines={1}>{order.address}</Text>
                          {order.totalPrice && <Text style={styles.orderPrice}>{order.totalPrice} MAD</Text>}
                          <View style={styles.progressMini}>
                            {STEPS.map((s, i) => (
                              <View key={s.key} style={[styles.progressMiniStep, i <= stepIdx && styles.progressMiniStepActive]} />
                            ))}
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}

                {pastOrders.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionRow}>
                      <Text style={styles.sectionLabel}>HISTORIQUE</Text>
                    </View>
                    {pastOrders.map(order => {
                      const items    = parseItems(order.items)
                      const hasRated = !!order.rating
                      return (
                        <TouchableOpacity
                          key={`past_${order.id}`}
                          style={styles.pastOrderCard}
                          onPress={() => { setSelected(order); setView('detail') }}
                        >
                          <View style={styles.thumbsRow}>
                            {items.slice(0, 3).map((item, i) =>
                              item.photo
                                ? <Image key={i} source={{ uri: item.photo }} style={styles.orderThumb} />
                                : null
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.orderAddr} numberOfLines={1}>{order.address}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                              {order.totalPrice && <Text style={styles.orderPrice2}>{order.totalPrice} MAD</Text>}
                              {order.status === 'delivered' && !hasRated && (
                                <View style={styles.toRateBadge}>
                                  <Text style={styles.toRateText}>A noter</Text>
                                </View>
                              )}
                              {hasRated && (
                                <Text style={styles.ratedStars}>
                                  {'★'.repeat(order.rating)}{'☆'.repeat(5 - order.rating)}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View style={styles.pastRight}>
                            <StatusBadge status={order.status} size="sm" />
                            <Text style={styles.chevronSm}>›</Text>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── List header
  listHeader: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  listGreet: { fontSize: 12, color: C.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  listTitle: { fontSize: 22, fontWeight: '900', color: C.dark, letterSpacing: -0.5 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 13, fontWeight: '700', color: C.dark },
  orderNowBtn: { backgroundColor: C.brand, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  orderNowText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // ── Section
  section:      { paddingHorizontal: 16, paddingTop: 20 },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textSecondary, letterSpacing: 1 },
  sectionBadge: { backgroundColor: C.brand, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  sectionBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // ── Active order card
  activeOrderCard: {
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.border, marginBottom: 12, padding: 16,
  },
  activeOrderTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pulseDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: C.brand },
  enRouteText:    { fontSize: 12, fontWeight: '700', color: C.brand, flex: 1 },
  annulableText:  { fontSize: 12, fontWeight: '600', color: C.textSecondary, flex: 1 },
  chevron:        { fontSize: 20, color: C.textMuted },
  thumbsRow:      { flexDirection: 'row', gap: 6, marginBottom: 10 },
  orderThumb:     { width: 44, height: 44, borderRadius: 10 },
  orderAddr:      { fontSize: 13, color: C.textSecondary, marginBottom: 6 },
  orderPrice:     { fontSize: 16, fontWeight: '800', color: C.dark, marginBottom: 10, letterSpacing: -0.3 },
  progressMini:   { flexDirection: 'row', gap: 5 },
  progressMiniStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  progressMiniStepActive: { backgroundColor: C.brand },

  // ── Past order card
  pastOrderCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  pastRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderPrice2:  { fontSize: 12, color: C.textSecondary, fontWeight: '600' },
  toRateBadge:  { backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  toRateText:   { fontSize: 11, color: '#B45309', fontWeight: '700' },
  ratedStars:   { fontSize: 12, color: '#F59E0B' },
  chevronSm:    { fontSize: 18, color: C.textMuted },

  // ── Empty
  emptyList:  { alignItems: 'center', paddingVertical: 64, gap: 16 },
  emptyCircle:{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.border },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.dark },

  // ── Order flow
  orderHeader: {
    backgroundColor: C.card, paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backLink:      { fontSize: 14, color: C.brand, fontWeight: '700' },
  progressBar:   { flex: 1, height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: C.brand, borderRadius: 2 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  orderScroll:   { flex: 1 },
  orderContent:  { padding: 20, paddingBottom: 40 },

  stepTitle: { fontSize: 24, fontWeight: '900', color: C.dark, letterSpacing: -0.5, marginBottom: 6 },
  stepSub:   { fontSize: 14, color: C.textSecondary, marginBottom: 24 },

  // Categories grid
  catsGrid: { gap: 14 },
  catCard:  { height: 160, borderRadius: 18, overflow: 'hidden' },
  catPhoto: { width: '100%', height: '100%' },
  catOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26,26,46,0.45)' },
  catTextBox: { position: 'absolute', bottom: 16, left: 16 },
  catLabel:   { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  catSub:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Cat tabs
  catTabs: { marginBottom: 18 },
  catTab: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.card, marginRight: 8,
  },
  catTabText: { fontSize: 13, fontWeight: '700', color: C.textSecondary },

  // Items grid
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  itemCard: {
    width: '47%', backgroundColor: C.card,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1.5, borderColor: C.border,
  },
  itemPhoto:       { width: '100%', height: 110 },
  itemQtyBadge:    { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  itemQtyBadgeText:{ fontSize: 12, fontWeight: '800', color: '#fff' },
  itemInfo:        { padding: 10 },
  itemName:        { fontSize: 13, fontWeight: '700', color: C.dark, marginBottom: 2 },
  itemDesc:        { fontSize: 11, color: C.textSecondary, marginBottom: 8 },
  itemFooter:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemPrice:       { fontSize: 14, fontWeight: '800' },
  addSmBtn:        { width: 28, height: 28, borderRadius: 8, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  addSmBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  qtyMini:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyMiniBtn:      { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  qtyMiniBtnPlus:  { backgroundColor: C.brand, borderColor: C.brand },
  qtyMiniBtnText:  { fontSize: 14, fontWeight: '800', color: C.dark },
  qtyMiniVal:      { fontSize: 13, fontWeight: '700', color: C.dark },

  // Cart bar
  cartBar: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: C.brand, borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cartBarLeft:  { fontSize: 14, fontWeight: '700', color: '#fff' },
  cartBarRight: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Form
  fieldGroup:  { marginBottom: 18 },
  fieldLabel:  { fontSize: 11, fontWeight: '800', color: C.textSecondary, letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: C.dark,
  },
  nextBtn:     { backgroundColor: C.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Summary
  summaryCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 14, overflow: 'hidden',
  },
  summaryRow:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  summaryThumb:     { width: 44, height: 44, borderRadius: 10 },
  summaryName:      { fontSize: 14, fontWeight: '700', color: C.dark },
  summaryQty:       { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  summaryPrice:     { fontSize: 14, fontWeight: '800', color: C.dark },
  summaryTotal:     { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderTopWidth: 1.5, borderTopColor: C.border },
  summaryTotalLabel:{ fontSize: 14, fontWeight: '700', color: C.dark },
  summaryTotalVal:  { fontSize: 18, fontWeight: '900', color: C.brand },
  summaryInfoRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryInfoLabel: { fontSize: 13, color: C.textSecondary },
  summaryInfoVal:   { fontSize: 13, fontWeight: '700', color: C.dark, maxWidth: '60%', textAlign: 'right' },

  confirmBtn:     { backgroundColor: C.brand, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  payNote:        { textAlign: 'center', fontSize: 13, color: C.textSecondary, marginBottom: 20 },
  btnDisabled:    { opacity: 0.45 },
  errorText:      { color: C.red, fontSize: 13, marginBottom: 12, fontWeight: '600' },
  successText:    { color: C.green, fontSize: 13, marginBottom: 12, fontWeight: '600' },

  // Detail view
  detailBack:     { position: 'absolute', top: 52, left: 16, zIndex: 10, backgroundColor: 'rgba(26,26,46,0.7)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  detailBackText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  detailPhoto:    { width: '100%', height: 280 },
  detailBody:     { flex: 1, backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: 20 },
  detailInfo:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  detailName:     { fontSize: 20, fontWeight: '900', color: C.dark, flex: 1, marginRight: 12 },
  detailPrice:    { fontSize: 22, fontWeight: '900' },
  detailDesc:     { fontSize: 14, color: C.textSecondary, lineHeight: 20, marginBottom: 20 },
  qtyRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  qtyLabel:       { fontSize: 14, fontWeight: '700', color: C.dark },
  qtyControl:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn:         { width: 34, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnPlus:     { backgroundColor: C.brand, borderColor: C.brand },
  qtyBtnText:     { fontSize: 18, fontWeight: '700', color: C.dark },
  qtyVal:         { fontSize: 18, fontWeight: '800', color: C.dark, minWidth: 28, textAlign: 'center' },
  qtyTotal:       { fontSize: 16, fontWeight: '800', color: C.brand },
  addBtn:         { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  addBtnText:     { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Detail order
  detailTopBar: {
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 14,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  statusBanner: {
    margin: 16, borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1,
  },
  statusMsg: { fontSize: 13, color: C.textPrimary, lineHeight: 19 },

  cancelCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  cancelCardTitle:    { fontSize: 14, fontWeight: '700', color: C.dark },
  cancelCardSub:      { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  cancelActionBtn:    { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  cancelActionBtnText:{ fontSize: 13, fontWeight: '700', color: C.red },

  rateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFBEB', borderRadius: 16,
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  rateCardTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  rateCardSub:   { fontSize: 12, color: '#B45309', marginTop: 2 },
  starIcon:      { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  starIconText:  { fontSize: 20, color: '#fff' },

  ratingDisplay: {
    backgroundColor: '#FFFBEB', borderRadius: 16,
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  ratingDisplayTitle: { fontSize: 12, fontWeight: '800', color: '#92400E', letterSpacing: 0.5 },
  ratingComment:      { fontSize: 13, color: '#B45309', marginTop: 8, fontStyle: 'italic' },

  // Progress track
  progressCard:    { backgroundColor: C.card, borderRadius: 18, marginHorizontal: 16, padding: 24, marginBottom: 12, position: 'relative' },
  progressTrack:   { position: 'absolute', top: 44, left: 48, right: 48, height: 3, backgroundColor: C.border },
  progressFillAbs: { position: 'absolute', top: 44, left: 48, height: 3, backgroundColor: C.brand, borderRadius: 2 },
  stepsRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem:        { alignItems: 'center', gap: 8, flex: 1 },
  stepDot:         { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F1F8', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.border },
  stepDotActive:   { backgroundColor: C.brand, borderColor: C.brand },
  stepNum:         { fontSize: 14, fontWeight: '800', color: C.textSecondary },
  stepLabel:       { fontSize: 11, color: C.textSecondary, fontWeight: '600', textAlign: 'center' },
  stepLabelActive: { color: C.brand },

  // Map
  mapCard:       { backgroundColor: C.card, borderRadius: 18, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden' },
  mapCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  liveGreen:     { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  mapCardTitle:  { fontSize: 14, fontWeight: '700', color: C.dark, flex: 1 },
  mapCardSub:    { fontSize: 12, color: C.textSecondary },
  map:           { height: 220 },
  mapNote:       { textAlign: 'center', fontSize: 11, color: C.textSecondary, padding: 10 },
  driverMarkerOuter: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,107,53,0.2)', alignItems: 'center', justifyContent: 'center' },
  driverMarkerInner: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.brand },

  // Info cards
  infoCard:       { backgroundColor: C.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  infoCardTitle:  { fontSize: 12, fontWeight: '800', color: C.textSecondary, letterSpacing: 0.8, padding: 16, paddingBottom: 10 },
  itemRow2:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  itemRow2Border: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemThumb2:     { width: 42, height: 42, borderRadius: 10 },
  itemRow2Name:   { flex: 1, fontSize: 13, color: C.dark, fontWeight: '500' },
  itemRow2Price:  { fontSize: 14, fontWeight: '800', color: C.brand },
  infoRowD:       { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabelD:     { fontSize: 13, color: C.textSecondary, flex: 1 },
  infoValueD:     { fontSize: 13, fontWeight: '700', color: C.dark, flex: 2, textAlign: 'right' },

  // Driver card
  driverCard: {
    backgroundColor: C.card, borderRadius: 16,
    marginHorizontal: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: C.border,
  },
  driverCardSticky: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.card, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: C.dark, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  driverAvatar:   { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  driverInitials: { fontSize: 16, fontWeight: '800', color: '#1D4ED8' },
  driverName:     { fontSize: 15, fontWeight: '700', color: C.dark },
  driverVehicle:  { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  callBtn:        { backgroundColor: C.green, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  callBtnText:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  callBtnLarge:   { backgroundColor: C.green, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 14 },
  callBtnLargeText:{ color: '#fff', fontSize: 14, fontWeight: '800' },
})

// ─── RatingModal styles ───────────────────────────────────────────────────────
const rStyles = StyleSheet.create({
  // KeyboardAvoidingView prend tout l'écran
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  // Zone sombre cliquable au-dessus du modal
  overlayBg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26,26,46,0.55)',
  },
  modal: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%',       // ne jamais dépasser 90% de l'écran
    paddingBottom: 16,
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: C.border,
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  modalHeader: {
    paddingHorizontal: 24, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: C.dark, marginBottom: 4 },
  modalSub:   { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
  modalBody:  { padding: 24 },

  starsRow:    { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  starBtn:     { padding: 6 },
  starText:    { fontSize: 40 },
  ratingLabel: { textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#D97706', marginBottom: 20 },

  commentLabel: {
    fontSize: 11, fontWeight: '800', color: C.textSecondary,
    letterSpacing: 1.2, marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.dark,
    // hauteur fixe — pas de minHeight pour éviter le débordement
    height: 100,
    marginBottom: 16,
    backgroundColor: C.bg,
  },
  errorText: { color: C.red, fontSize: 13, marginBottom: 12, fontWeight: '600' },

  modalBtns:     { flexDirection: 'row', gap: 12, marginBottom: 8 },
  cancelBtn:     {
    flex: 1, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
  submitBtn:     { flex: 1, backgroundColor: C.brand, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
})
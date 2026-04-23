import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, Image, TextInput, ActivityIndicator,
  Alert, Linking, RefreshControl,
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import api from '../api/api'
import useAuthStore from '../store/authStore'
import StatusBadge from '../components/StatusBadge'

// ─── Données catalogue ────────────────────────────────────────────────────────
const STEPS = [
  { key: 'pending', label: 'Confirmée', icon: '📋' },
  { key: 'in_progress', label: 'En route', icon: '🚴' },
  { key: 'delivered', label: 'Livrée', icon: '✅' },
]

const STATUS_INFO = {
  pending: { msg: 'Commande confirmée. Un livreur va prendre en charge votre colis.' },
  in_progress: { msg: 'Votre livreur est en route ! Suivez-le sur la carte ci-dessous.' },
  delivered: { msg: 'Livraison effectuée avec succès. Merci de votre confiance !' },
  failed: { msg: 'La livraison a échoué ou a été annulée.' },
}

const CATEGORIES = [
  {
    id: 'cafe', label: 'Café', subtitle: 'Boissons chaudes & froides', accent: '#6F4E37',
    photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop',
    items: [
      { id: 'c1', name: 'Café Marocain', description: 'Cardamome & cannelle', price: 8, photo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop' },
      { id: 'c2', name: 'Cappuccino', description: 'Mousse de lait veloutée', price: 15, photo: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop' },
      { id: 'c3', name: "Jus d'orange frais", description: 'Pressé minute, 100% naturel', price: 12, photo: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop' },
      { id: 'c4', name: 'Thé à la menthe', description: 'Gunpowder & menthe fraîche', price: 10, photo: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop' },
      { id: 'c5', name: 'Smoothie fruits', description: 'Fraise, banane & mangue', price: 18, photo: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop' },
      { id: 'c6', name: 'Café Glacé', description: 'Double espresso sur glace', price: 20, photo: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: 'resto', label: 'Restaurants', subtitle: 'Plats locaux & internationaux', accent: '#C0392B',
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    items: [
      { id: 'r1', name: 'Pizza Margherita', description: 'Tomate, mozzarella, basilic', price: 55, photo: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop' },
      { id: 'r2', name: 'Couscous royal', description: 'Agneau, merguez, légumes', price: 70, photo: 'https://images.unsplash.com/photo-1628294896516-3c88dc6b07af?w=400&h=300&fit=crop' },
      { id: 'r3', name: 'Tajine poulet', description: 'Citron confit & olives', price: 65, photo: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop' },
      { id: 'r4', name: 'Burger classique', description: 'Steak haché, cheddar', price: 50, photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop' },
      { id: 'r5', name: 'Pastilla poulet', description: 'Feuilleté sucré-salé', price: 45, photo: 'https://images.unsplash.com/photo-1621501103258-9253c3a5e358?w=400&h=300&fit=crop' },
      { id: 'r6', name: 'Salade niçoise', description: 'Thon, œuf, olives', price: 35, photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: 'shop', label: 'Shopping', subtitle: 'Colis, courses & cadeaux', accent: '#1A5276',
    photo: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop',
    items: [
      { id: 's1', name: 'Colis standard', description: "Jusqu'à 5 kg", price: 15, photo: 'https://images.unsplash.com/photo-1595079676601-f1adf5be5dee?w=400&h=300&fit=crop' },
      { id: 's2', name: 'Colis express', description: 'Livraison en < 1h', price: 30, photo: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=300&fit=crop' },
      { id: 's3', name: 'Documents', description: 'Enveloppes, contrats', price: 10, photo: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&h=300&fit=crop' },
      { id: 's4', name: 'Courses alimentaires', description: 'Supermarché, épicerie', price: 20, photo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop' },
      { id: 's5', name: 'Fleurs & Cadeaux', description: 'Bouquets, coffrets', price: 25, photo: 'https://images.unsplash.com/photo-1487530811015-780f2f08b77a?w=400&h=300&fit=crop' },
      { id: 's6', name: 'Électronique', description: 'Fragile, assuré', price: 35, photo: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop' },
    ],
  },
  {
    id: 'pharma', label: 'Pharmacie', subtitle: 'Médicaments & soins', accent: '#1D6A3A',
    photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
    items: [
      { id: 'p1', name: 'Médicaments ordonnance', description: 'Sur ordonnance valide', price: 12, photo: 'https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=400&h=300&fit=crop' },
      { id: 'p2', name: 'Paracétamol 500mg', description: 'Boîte de 20 comprimés', price: 8, photo: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=300&fit=crop' },
      { id: 'p3', name: 'Crème solaire SPF50+', description: '150ml, résistant eau', price: 45, photo: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop' },
      { id: 'p4', name: 'Vitamines & compléments', description: 'Vit C, D, magnésium', price: 35, photo: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=400&h=300&fit=crop' },
      { id: 'p5', name: 'Masques FFP2', description: 'Boîte de 10', price: 15, photo: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&fit=crop' },
      { id: 'p6', name: 'Thermomètre digital', description: 'Résultat en 10 secondes', price: 60, photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop' },
    ],
  },
]

const ALL_ITEMS = CATEGORIES.flatMap(c => c.items)

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ClientTrackingScreen({ navigation }) {
  const { user } = useAuthStore()

  // Navigation interne
  const [view, setView] = useState('list')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState(null)
  const [driverPos, setDriverPos] = useState(null)

  // Flow commande
  const [step, setStep] = useState(0)
  const [activeCat, setActiveCat] = useState(null)
  const [activeItem, setActiveItem] = useState(null)
  const [cart, setCart] = useState({})
  const [form, setForm] = useState({ address: '', pickupAddress: '', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const posInterval = useRef(null)
  const autoRefresh = useRef(null)

  // ── Panier ──
  const cartItems = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ ...ALL_ITEMS.find(i => i.id === id), qty }))
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const addItem = (item) => setCart(c => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }))
  const removeItem = (id) => setCart(c => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n })

  // ── Déconnexion ──
  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnecter', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['token', 'user', 'role'])
            navigation.replace('Login')
          }
        }
      ]
    )
  }

  // ── Vérification connexion ──
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token')
      console.log('🔑 [ClientTracking] Token:', token ? 'PRÉSENT' : 'ABSENT')
      
      if (!token) {
        Alert.alert('Session expirée', 'Veuillez vous reconnecter', [
          { text: 'OK', onPress: () => navigation.replace('Login') }
        ])
        return
      }
      
      loadOrders()
    }
    checkAuth()
  }, [])

  // ── Charger commandes ──
  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await api.get('/client/my-orders')
      setOrders(data || [])
    } catch (err) {
      console.error('Erreur chargement commandes:', err)
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    autoRefresh.current = setInterval(() => loadOrders(true), 15000)
    return () => clearInterval(autoRefresh.current)
  }, [loadOrders])

  // ── Polling position livreur ──
  useEffect(() => {
    clearInterval(posInterval.current)
    const driverId = selected?.DeliveryOrder?.driverId
    if (selected?.status === 'in_progress' && driverId) {
      const fetchPos = () =>
        api.get(`/tracking/position/${driverId}`)
          .then(r => { if (r.data?.latitude) setDriverPos({ latitude: r.data.latitude, longitude: r.data.longitude }) })
          .catch(() => {})
      fetchPos()
      posInterval.current = setInterval(fetchPos, 10000)
    } else {
      setDriverPos(null)
    }
    return () => clearInterval(posInterval.current)
  }, [selected])

  // ── Reset flow commande ──
  const resetForm = () => {
    setCart({})
    setForm({ address: '', pickupAddress: '', note: '' })
    setStep(0)
    setActiveCat(null)
    setActiveItem(null)
    setError('')
    setSuccess('')
  }

  // ── Soumettre commande ──
  const handleSubmit = async () => {
    if (!form.address.trim()) {
      setError('Adresse de livraison requise')
      return
    }
    
    const token = await AsyncStorage.getItem('token')
    if (!token) {
      setError('Vous n\'êtes pas connecté. Veuillez vous reconnecter.')
      setTimeout(() => navigation.replace('Login'), 2000)
      return
    }
    
    setError('')
    setSubmitting(true)
    try {
      const items = cartItems.map(i => ({ name: i.name, qty: i.qty, price: i.price, photo: i.photo }))
      await api.post('/client/order', {
        address: form.address,
        pickupAddress: form.pickupAddress,
        note: form.note,
        items,
        latitude: 31.6295,
        longitude: -7.9811,
      })
      setSuccess('Commande passée avec succès !')
      await loadOrders(true)
      setTimeout(() => {
        resetForm()
        setView('list')
      }, 1500)
    } catch (err) {
      console.error('Erreur commande:', err.response?.data)
      setError(err.response?.data?.error || 'Erreur lors de la commande')
    } finally {
      setSubmitting(false)
    }
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'failed')
  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'failed')
  const parseItems = raw => Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw || '[]') : [])

  // ══════════════════════════════════════════════════════
  // VUE COMMANDE
  // ══════════════════════════════════════════════════════
  if (view === 'order') {
    const progressPct = ((step + 1) / 4) * 100

    // Fiche détail article
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
              <Text style={[styles.detailPrice, { color: cat?.accent }]}>{activeItem.price} MAD</Text>
            </View>
            <Text style={styles.detailDesc}>{activeItem.description}</Text>
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantité</Text>
              <View style={styles.qtyControl}>
                <TouchableOpacity onPress={() => removeItem(activeItem.id)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{qty}</Text>
                <TouchableOpacity onPress={() => addItem(activeItem)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              {qty > 0 && <Text style={styles.qtyTotal}>= {activeItem.price * qty} MAD</Text>}
            </View>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: cat?.accent || '#1a1a1a' }]}
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

          {/* STEP 0 : Catégories */}
          {step === 0 && (
            <>
              <Text style={styles.stepTitle}>Que voulez-vous livrer ?</Text>
              <Text style={styles.stepSub}>Choisissez une catégorie</Text>
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
                    style={[styles.catTab, activeCat.id === cat.id && { backgroundColor: activeCat.accent, borderColor: activeCat.accent }]}
                  >
                    <Text style={[styles.catTabText, activeCat.id === cat.id && { color: '#fff' }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.itemsGrid}>
                {activeCat.items.map(item => {
                  const qty = cart[item.id] || 0
                  return (
                    <View key={item.id} style={[styles.itemCard, qty > 0 && { borderColor: activeCat.accent, borderWidth: 2 }]}>
                      <TouchableOpacity onPress={() => setActiveItem(item)}>
                        <Image source={{ uri: item.photo }} style={styles.itemPhoto} />
                        {qty > 0 && (
                          <View style={[styles.itemQtyBadge, { backgroundColor: activeCat.accent }]}>
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
                          <Text style={[styles.itemPrice, { color: activeCat.accent }]}>{item.price} MAD</Text>
                          {qty === 0 ? (
                            <TouchableOpacity onPress={() => addItem(item)} style={[styles.addSmBtn, { backgroundColor: activeCat.accent }]}>
                              <Text style={styles.addSmBtnText}>+</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.qtyMini}>
                              <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.qtyMiniBtn}>
                                <Text style={[styles.qtyMiniBtnText, { color: activeCat.accent }]}>−</Text>
                              </TouchableOpacity>
                              <Text style={[styles.qtyMiniVal, { color: activeCat.accent }]}>{qty}</Text>
                              <TouchableOpacity onPress={() => addItem(item)} style={[styles.qtyMiniBtn, { backgroundColor: activeCat.accent }]}>
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
              <Text style={styles.stepTitle}>Où livrer ?</Text>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ADRESSE DE RÉCUPÉRATION</Text>
                <TextInput
                  style={styles.input}
                  value={form.pickupAddress}
                  onChangeText={v => setForm(f => ({ ...f, pickupAddress: v }))}
                  placeholder="Ex: Marché central…"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ADRESSE DE LIVRAISON *</Text>
                <TextInput
                  style={styles.input}
                  value={form.address}
                  onChangeText={v => setForm(f => ({ ...f, address: v }))}
                  placeholder="Ex: 12 Rue Mohammed V, Marrakech"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>INSTRUCTIONS</Text>
                <TextInput
                  style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                  value={form.note}
                  onChangeText={v => setForm(f => ({ ...f, note: v }))}
                  placeholder="Ex: Sonnez 2 fois, 1er étage…"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() => { if (!form.address.trim()) { setError('Adresse requise'); return } setError(''); setStep(3) }}
              >
                <Text style={styles.nextBtnText}>Continuer →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 3 : Résumé */}
          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Résumé de commande</Text>
              {error && <Text style={styles.errorText}>{error}</Text>}
              {success && <Text style={styles.successText}>{success}</Text>}

              <View style={styles.summaryCard}>
                {cartItems.map((item, idx) => (
                  <View key={item.id} style={[styles.summaryRow, idx < cartItems.length - 1 && styles.summaryRowBorder]}>
                    <Image source={{ uri: item.photo }} style={styles.summaryThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.summaryName}>{item.name}</Text>
                      <Text style={styles.summaryQty}>{item.qty} × {item.price} MAD</Text>
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
                  { i: '📍', l: 'Récupéré chez', v: form.pickupAddress || 'Entrepôt central' },
                  { i: '🏠', l: 'Livré à', v: form.address },
                  { i: '👤', l: 'Destinataire', v: `${user?.name} · ${user?.phone}` },
                  { i: '🕐', l: 'Délai estimé', v: "Aujourd'hui · 30–60 min" },
                ].map((r, i) => (
                  <View key={i} style={styles.summaryInfoRow}>
                    <Text style={styles.summaryInfoIcon}>{r.i}</Text>
                    <View>
                      <Text style={styles.summaryInfoLabel}>{r.l}</Text>
                      <Text style={styles.summaryInfoVal}>{r.v}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[styles.confirmBtn, submitting && styles.btnDisabled]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirmer · {cartTotal} MAD</Text>}
              </TouchableOpacity>
              <Text style={styles.payNote}>Paiement à la livraison</Text>
            </>
          )}
        </ScrollView>
      </View>
    )
  }

  // ══════════════════════════════════════════════════════
  // VUE DÉTAIL COMMANDE
  // ══════════════════════════════════════════════════════
  if (view === 'detail' && selected) {
    const info = STATUS_INFO[selected.status] || STATUS_INFO.pending
    const stepIdx = STEPS.findIndex(s => s.key === selected.status)
    const items = parseItems(selected.items)
    const driver = selected.DeliveryOrder?.Driver

    const statusBg = {
      pending: '#FEF9C3', in_progress: '#DBEAFE',
      delivered: '#DCFCE7', failed: '#FEE2E2',
    }[selected.status] || '#F3F4F6'

    return (
      <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.detailTopBar}>
          <TouchableOpacity onPress={() => setView('list')}>
            <Text style={styles.backLink}>← Mes commandes</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.statusBanner, { backgroundColor: statusBg }]}>
          <StatusBadge status={selected.status} />
          <Text style={styles.statusMsg}>{info.msg}</Text>
        </View>

        {selected.status !== 'failed' && (
          <View style={styles.progressCard}>
            <View style={styles.progressTrack} />
            <View style={[styles.progressFillAbs, { width: stepIdx === 0 ? '0%' : stepIdx === 1 ? '50%' : '100%' }]} />
            <View style={styles.stepsRow}>
              {STEPS.map((s, i) => (
                <View key={s.key} style={styles.stepItem}>
                  <View style={[styles.stepDot, i <= stepIdx && styles.stepDotActive]}>
                    <Text style={styles.stepIcon}>{s.icon}</Text>
                  </View>
                  <Text style={[styles.stepLabel, i <= stepIdx && styles.stepLabelActive]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selected.status === 'in_progress' && (
          <View style={styles.mapCard}>
            <View style={styles.mapCardHeader}>
              <View style={styles.liveGreen} />
              <Text style={styles.mapCardTitle}>Suivi GPS en direct</Text>
              {!driverPos && <Text style={styles.mapCardSub}>En attente…</Text>}
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
                  <View style={styles.driverMarker}><Text style={{ fontSize: 20 }}>🛵</Text></View>
                </Marker>
              )}
              {selected.latitude && selected.longitude && (
                <Marker coordinate={{ latitude: selected.latitude, longitude: selected.longitude }} pinColor="#EF4444" />
              )}
            </MapView>
            <Text style={styles.mapNote}>Position mise à jour toutes les 10 secondes</Text>
          </View>
        )}

        {items.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Articles commandés</Text>
            {items.map((item, i) => (
              <View key={i} style={[styles.itemRow2, i < items.length - 1 && styles.itemRow2Border]}>
                {item.photo && <Image source={{ uri: item.photo }} style={styles.itemThumb2} />}
                <Text style={styles.itemRow2Name}>{item.name} ×{item.qty}</Text>
                <Text style={styles.itemRow2Price}>{item.price * item.qty} MAD</Text>
              </View>
            ))}
            {selected.totalPrice && (
              <View style={[styles.itemRow2, { borderTopWidth: 2, borderTopColor: '#E5E7EB', marginTop: 4, paddingTop: 10 }]}>
                <Text style={[styles.itemRow2Name, { fontWeight: '800' }]}>Total</Text>
                <Text style={[styles.itemRow2Price, { fontSize: 16 }]}>{selected.totalPrice} MAD</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Détails</Text>
          <InfoRowDetail label="🏠 Adresse" value={selected.address} />
          {selected.pickupAddress && <InfoRowDetail label="📍 Récupéré chez" value={selected.pickupAddress} />}
        </View>

        {driver && (
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
              <Text style={styles.callBtnText}>📞 Appeler</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    )
  }

  // ══════════════════════════════════════════════════════
  // VUE LISTE
  // ══════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={(
          <View>
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.listTitle}>Mes commandes</Text>
                <Text style={styles.listSub}>Bonjour, {user?.name?.split(' ')[0] || 'Client'} 👋</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <Text style={styles.logoutBtnText}>🚪</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.orderNowBtn} onPress={() => { resetForm(); setView('order') }}>
                  <Text style={styles.orderNowText}>+ Commander</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 60 }} />
            ) : orders.length === 0 ? (
              <View style={styles.emptyList}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyTitle}>Aucune commande</Text>
                <TouchableOpacity style={styles.orderNowBtn} onPress={() => { resetForm(); setView('order') }}>
                  <Text style={styles.orderNowText}>Commander maintenant</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {activeOrders.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>EN COURS</Text>
                    {activeOrders.map(order => {
                      const stepIdx = STEPS.findIndex(s => s.key === order.status)
                      const items = parseItems(order.items)
                      return (
                        <TouchableOpacity key={order.id} style={styles.activeOrderCard} onPress={() => { setSelected(order); setView('detail') }}>
                          <View style={styles.activeOrderTop}>
                            <View style={styles.pulseBlue} />
                            <StatusBadge status={order.status} />
                            {order.status === 'in_progress' && <Text style={styles.enRouteText}>🚴 En route</Text>}
                            <Text style={styles.chevron}>›</Text>
                          </View>
                          <View style={styles.thumbsRow}>
                            {items.slice(0, 4).map((item, i) => item.photo && <Image key={i} source={{ uri: item.photo }} style={styles.orderThumb} />)}
                          </View>
                          <Text style={styles.orderAddr} numberOfLines={1}>🏠 {order.address}</Text>
                          {order.totalPrice && <Text style={styles.orderPrice}>{order.totalPrice} MAD</Text>}
                          <View style={styles.progressMini}>
                            {STEPS.map((s, i) => <View key={s.key} style={[styles.progressMiniStep, i <= stepIdx && styles.progressMiniStepActive]} />)}
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}

                {pastOrders.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>HISTORIQUE</Text>
                    {pastOrders.map(order => {
                      const items = parseItems(order.items)
                      return (
                        <TouchableOpacity key={order.id} style={styles.pastOrderCard} onPress={() => { setSelected(order); setView('detail') }}>
                          <View style={styles.thumbsRow}>
                            {items.slice(0, 3).map((item, i) => item.photo && <Image key={i} source={{ uri: item.photo }} style={styles.orderThumb} />)}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.orderAddr} numberOfLines={1}>{order.address}</Text>
                            {order.totalPrice && <Text style={styles.orderPrice2}>{order.totalPrice} MAD</Text>}
                          </View>
                          <View style={styles.pastRight}>
                            <StatusBadge status={order.status} size="sm" />
                            <Text style={styles.chevron}>›</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders() }} colors={['#2563EB']} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  )
}

// ─── Sous-composant ────────────────────────────────────────────────────────────
function InfoRowDetail({ label, value }) {
  return (
    <View style={styles.infoRowD}>
      <Text style={styles.infoLabelD}>{label}</Text>
      <Text style={styles.infoValueD}>{value}</Text>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },

  orderHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backLink: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  progressBar: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 3 },
  progressLabel: { fontSize: 12, color: '#9CA3AF' },
  orderScroll: { flex: 1 },
  orderContent: { padding: 20, paddingBottom: 40 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  stepSub: { fontSize: 14, color: '#6B7280', marginBottom: 20 },

  catsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: { width: '47%', height: 140, borderRadius: 18, overflow: 'hidden', position: 'relative' },
  catPhoto: { width: '100%', height: '100%', position: 'absolute' },
  catOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  catTextBox: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  catLabel: { color: '#fff', fontSize: 15, fontWeight: '800' },
  catSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },

  catTabs: { marginBottom: 16 },
  catTab: { borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  catTabText: { fontSize: 13, fontWeight: '600', color: '#374151' },

  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  itemCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  itemPhoto: { width: '100%', height: 110 },
  itemQtyBadge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemQtyBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  itemInfo: { padding: 10 },
  itemName: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  itemDesc: { fontSize: 11, color: '#9CA3AF', marginBottom: 8 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemPrice: { fontSize: 14, fontWeight: '800' },
  addSmBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addSmBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22 },

  qtyMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyMiniBtn: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  qtyMiniBtnText: { fontSize: 14, fontWeight: '700' },
  qtyMiniVal: { fontSize: 13, fontWeight: '800', minWidth: 16, textAlign: 'center' },

  cartBar: {
    backgroundColor: '#2563EB', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  cartBarLeft: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cartBarRight: { color: '#fff', fontSize: 15, fontWeight: '700' },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  errorText: { color: '#DC2626', fontSize: 13, marginBottom: 12 },
  successText: { color: '#16A34A', fontSize: 13, fontWeight: '600', marginBottom: 12 },
  nextBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  summaryCard: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  summaryThumb: { width: 52, height: 52, borderRadius: 12 },
  summaryName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  summaryQty: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  summaryPrice: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  summaryTotalLabel: { fontSize: 15, fontWeight: '800', color: '#111827' },
  summaryTotalVal: { fontSize: 16, fontWeight: '800', color: '#2563EB' },
  summaryInfoRow: { flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  summaryInfoIcon: { fontSize: 18, marginTop: 2 },
  summaryInfoLabel: { fontSize: 11, color: '#9CA3AF' },
  summaryInfoVal: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 },
  confirmBtn: { backgroundColor: '#2563EB', borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginBottom: 10 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  payNote: { textAlign: 'center', fontSize: 12, color: '#9CA3AF' },
  btnDisabled: { opacity: 0.5 },

  detailPhoto: { width: '100%', height: 260 },
  detailBack: { position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  detailBackText: { fontSize: 20, color: '#111827', fontWeight: '700' },
  detailBody: { flex: 1, padding: 20 },
  detailInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  detailName: { fontSize: 22, fontWeight: '800', color: '#111827', flex: 1 },
  detailPrice: { fontSize: 20, fontWeight: '800', marginLeft: 12, marginTop: 2 },
  detailDesc: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 24 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  qtyLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 30, paddingHorizontal: 12, paddingVertical: 8, gap: 16 },
  qtyBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 22, fontWeight: '700', color: '#111827' },
  qtyVal: { fontSize: 20, fontWeight: '800', color: '#111827', minWidth: 24, textAlign: 'center' },
  qtyTotal: { fontSize: 14, color: '#6B7280' },
  addBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  listHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: 52, 
    paddingBottom: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  listTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  listSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  orderNowBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
  orderNowText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  logoutBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 },
  activeOrderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 2, borderColor: '#BFDBFE', marginBottom: 12 },
  activeOrderTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pulseBlue: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' },
  enRouteText: { fontSize: 12, color: '#2563EB', fontWeight: '600', marginLeft: 4 },
  chevron: { marginLeft: 'auto', fontSize: 18, color: '#D1D5DB' },
  thumbsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  orderThumb: { width: 42, height: 42, borderRadius: 10 },
  orderAddr: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  orderPrice: { fontSize: 14, fontWeight: '800', color: '#2563EB', marginBottom: 10 },
  progressMini: { flexDirection: 'row', gap: 6 },
  progressMiniStep: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#F3F4F6' },
  progressMiniStepActive: { backgroundColor: '#3B82F6' },

  pastOrderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pastRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderPrice2: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  emptyList: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },

  detailTopBar: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  statusBanner: { margin: 16, borderRadius: 18, padding: 16, gap: 10 },
  statusMsg: { fontSize: 14, color: '#374151', lineHeight: 20 },

  progressCard: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, padding: 20, marginBottom: 14, position: 'relative' },
  progressTrack: { position: 'absolute', top: 40, left: 40, right: 40, height: 3, backgroundColor: '#E5E7EB' },
  progressFillAbs: { position: 'absolute', top: 40, left: 40, height: 3, backgroundColor: '#3B82F6', borderRadius: 2 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', gap: 8, flex: 1 },
  stepDot: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  stepDotActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  stepIcon: { fontSize: 18 },
  stepLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },
  stepLabelActive: { color: '#2563EB' },

  mapCard: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, marginBottom: 14, overflow: 'hidden' },
  mapCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  liveGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  mapCardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  mapCardSub: { fontSize: 12, color: '#9CA3AF' },
  map: { height: 220 },
  mapNote: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', padding: 10 },
  driverMarker: { backgroundColor: '#fff', borderRadius: 20, padding: 4, borderWidth: 2, borderColor: '#2563EB' },

  infoCard: { backgroundColor: '#fff', borderRadius: 18, marginHorizontal: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  infoCardTitle: { fontSize: 14, fontWeight: '700', color: '#374151', padding: 16, paddingBottom: 8 },
  itemRow2: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  itemRow2Border: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  itemThumb2: { width: 44, height: 44, borderRadius: 10 },
  itemRow2Name: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  itemRow2Price: { fontSize: 14, fontWeight: '700', color: '#2563EB' },

  infoRowD: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  infoLabelD: { fontSize: 13, color: '#6B7280', flex: 1 },
  infoValueD: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 2, textAlign: 'right' },

  driverCard: { backgroundColor: '#fff', borderRadius: 18, marginHorizontal: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  driverInitials: { fontSize: 16, fontWeight: '800', color: '#1D4ED8' },
  driverName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  driverVehicle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  callBtn: { backgroundColor: '#22C55E', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  callBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
})
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator, Modal,
  ScrollView, Image, AppState,
} from 'react-native'
import * as Location from 'expo-location'
import api from '../api/api'
import useAuthStore from '../store/authStore'
import StatusBadge from '../components/StatusBadge'

const FAILURE_REASONS = [
  'Client absent',
  'Adresse introuvable',
  'Refus de réception',
  'Colis endommagé',
  'Autre',
]

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuthStore()

  const [available,  setAvailable]  = useState([])
  const [myOrders,   setMyOrders]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab,        setTab]        = useState('available')
  const [gpsOn,      setGpsOn]      = useState(false)
  const [accepting,  setAccepting]  = useState(null)

  const [detailModal, setDetailModal] = useState(null)
  const [failModal,   setFailModal]   = useState(false)
  const [failNote,    setFailNote]    = useState('')
  const [pendingFail, setPendingFail] = useState(null)
  const [updatingId,  setUpdatingId]  = useState(null)

  const refreshInterval = useRef(null)
  const gpsInterval     = useRef(null)
  const appState        = useRef(AppState.currentState)

  // ── Charger les données ─────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [avRes, myRes] = await Promise.all([
        api.get('/drivers/available-orders'),
        api.get('/drivers/me/orders'),
      ])

      const dedup = (arr) => {
        const seen = new Set()
        return (arr || []).filter(item => {
          if (seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
      }

      setAvailable(dedup(avRes.data))
      setMyOrders(dedup(myRes.data))
    } catch (err) {
      if (!silent) Alert.alert('Erreur', 'Impossible de charger les livraisons.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // ── GPS ─────────────────────────────────────────────────────────────────────
  const sendGps = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      await api.post('/tracking/gps', {
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
      })
    } catch {}
  }

  const startGps = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return
    setGpsOn(true)
    sendGps()
    gpsInterval.current = setInterval(sendGps, 30000)
  }

  // ── Montage ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData()
    refreshInterval.current = setInterval(() => loadData(true), 15000)
    startGps()

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && appState.current !== 'active') loadData(true)
      appState.current = state
    })

    return () => {
      clearInterval(refreshInterval.current)
      clearInterval(gpsInterval.current)
      sub.remove()
    }
  }, [])

  // ── Accepter une commande ───────────────────────────────────────────────────
  const acceptOrder = async (pointId) => {
    setAccepting(pointId)
    try {
      await api.post(`/drivers/accept-point/${pointId}`)
      Alert.alert('Succès', 'Commande acceptée !')
      setTab('mine')
      await loadData(true)
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.error || "Impossible d'accepter la commande.")
    } finally {
      setAccepting(null)
    }
  }

  // ── Mettre à jour le statut d'un point ─────────────────────────────────────
  const updateStatus = async (pointId, status, note = '') => {
    setUpdatingId(pointId)
    try {
      await api.patch(`/points/${pointId}/status`, { status, failureNote: note })
      if (status === 'in_progress') sendGps()
      setDetailModal(null)
      await loadData(true)
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.error || 'Impossible de mettre à jour.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleFail = (point) => {
    setPendingFail(point)
    setFailNote('')
    setFailModal(true)
  }

  const confirmFail = async () => {
    if (!failNote) { Alert.alert('Requis', 'Sélectionnez une raison.'); return }
    setFailModal(false)
    await updateStatus(pendingFail.id, 'failed', failNote)
    setPendingFail(null)
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const allMyPoints = myOrders.flatMap(o => o.DeliveryPoints || [])
  const delivered   = allMyPoints.filter(p => p.status === 'delivered').length
  const inProgress  = allMyPoints.filter(p => p.status === 'in_progress').length

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const parseItems = (raw) => {
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
    return []
  }

  // ── Déconnexion ─────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout()
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
          },
        },
      ]
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDU : Carte commande disponible
  // ════════════════════════════════════════════════════════════════════════════
  const renderAvailable = ({ item: point }) => {
    const items = parseItems(point.items)

    return (
      <View style={styles.availCard}>
        <View style={styles.availHeader}>
          <View style={styles.newBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.newBadgeText}>NOUVELLE</Text>
          </View>
          <Text style={styles.availDate}>
            {point.createdAt
              ? new Date(point.createdAt).toLocaleDateString('fr-FR')
              : ''}
          </Text>
        </View>

        <View style={styles.availBody}>
          <Text style={styles.clientName}>{point.clientName || 'Client'}</Text>

          <View style={styles.addressRow}>
            <View style={styles.addressDot} />
            <Text style={styles.addressText}>{point.address}</Text>
          </View>

          {!!point.pickupAddress && (
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: '#FF6B35' }]} />
              <Text style={[styles.addressText, { color: '#FF6B35' }]}>
                Récupérer : {point.pickupAddress}
              </Text>
            </View>
          )}

          {items.length > 0 && (
            <View style={styles.chipsRow}>
              {items.map((it, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{it.name} x{it.qty}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.availFooter}>
            {point.totalPrice
              ? <Text style={styles.priceText}>{point.totalPrice} MAD</Text>
              : <View />
            }
            <TouchableOpacity
              style={[styles.acceptBtn, accepting === point.id && styles.btnDisabled]}
              onPress={() => acceptOrder(point.id)}
              disabled={!!accepting}
            >
              {accepting === point.id
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.acceptBtnText}>Accepter</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDU : Tournée acceptée
  // ════════════════════════════════════════════════════════════════════════════
  const renderMyOrder = ({ item: order }) => {
    const points = order.DeliveryPoints || []

    return (
      <View style={styles.myOrderCard}>
        <View style={styles.myOrderHeader}>
          <View>
            <Text style={styles.myOrderTitle}>
              {order.date
                ? new Date(order.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Livraison'}
            </Text>
            <Text style={styles.myOrderSub}>{points.length} arrêt{points.length > 1 ? 's' : ''}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        {points.map(pt => {
          const items = parseItems(pt.items)
          const done  = pt.status === 'delivered' || pt.status === 'failed'

          return (
            <TouchableOpacity
              key={`${order.id}-${pt.id}`}
              style={styles.ptCard}
              onPress={() => setDetailModal(pt)}
              activeOpacity={0.85}
            >
              <View style={styles.ptCardTop}>
                <View style={styles.seqBadge}>
                  <Text style={styles.seqText}>{pt.sequence}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ptClientName}>{pt.clientName}</Text>
                  <Text style={styles.ptAddr} numberOfLines={1}>{pt.address}</Text>
                  {pt.pickupAddress
                    ? <Text style={styles.ptPickup}>{pt.pickupAddress}</Text>
                    : null
                  }
                </View>
                <StatusBadge status={pt.status} size="sm" />
              </View>

              {items.length > 0 && (
                <View style={styles.chipsRow}>
                  {items.map((it, i) => (
                    <View key={i} style={styles.chipBlue}>
                      <Text style={styles.chipBlueText}>
                        {it.name}{it.qty ? ` x${it.qty}` : ''}
                      </Text>
                    </View>
                  ))}
                  {pt.totalPrice
                    ? <Text style={styles.ptPrice}>{pt.totalPrice} MAD</Text>
                    : null
                  }
                </View>
              )}

              {!done && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.deliveredBtn, updatingId === pt.id && styles.btnDisabled]}
                    onPress={() => updateStatus(pt.id, 'delivered')}
                    disabled={!!updatingId}
                  >
                    {updatingId === pt.id
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.deliveredBtnText}>Livré</Text>
                    }
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.failedBtn, updatingId === pt.id && styles.btnDisabled]}
                    onPress={() => handleFail(pt)}
                    disabled={!!updatingId}
                  >
                    <Text style={styles.failedBtnText}>Echec</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => navigation?.navigate('Map', { point: pt })}
                  >
                    <Text style={styles.mapBtnText}>Carte</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HEADER
  // ════════════════════════════════════════════════════════════════════════════
  const ListHeader = () => (
    <View>
      <View style={styles.appBar}>
        <View>
          <Text style={styles.appBarGreet}>Bonjour, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.appBarTitle}>Mes livraisons</Text>
        </View>
        <View style={styles.appBarRight}>
          {gpsOn && (
            <View style={styles.gpsBadge}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>GPS</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => loadData(true)} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, styles.iconBtnDanger]}>
            <Text style={[styles.iconBtnText, { color: '#EF4444' }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {myOrders.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#00B14F' }]}>{delivered}</Text>
            <Text style={styles.statLabel}>Livrés</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={[styles.statVal, { color: '#FF6B35' }]}>{inProgress}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#1A1A2E' }]}>{myOrders.length}</Text>
            <Text style={styles.statLabel}>Tournées</Text>
          </View>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'available' && styles.tabActive]}
          onPress={() => setTab('available')}
        >
          <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>
            Nouvelles
          </Text>
          {available.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{available.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'mine' && styles.tabActive]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>
            Mes livraisons
          </Text>
          {myOrders.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: '#1A1A2E' }]}>
              <Text style={styles.tabBadgeText}>{myOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // RENDU PRINCIPAL
  // ════════════════════════════════════════════════════════════════════════════
  const data       = tab === 'available' ? available : myOrders
  const renderItem = tab === 'available' ? renderAvailable : renderMyOrder
  const emptyMsg   = tab === 'available'
    ? { title: 'Aucune commande disponible', sub: 'Les nouvelles commandes apparaîtront ici' }
    : { title: 'Aucune livraison en cours',  sub: 'Acceptez une commande pour commencer' }

  return (
    <View style={styles.root}>
      {loading ? (
        <>
          <ListHeader />
          <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 60 }} />
        </>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.id ?? index}-${index}`}
          renderItem={renderItem}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData() }}
              colors={['#FF6B35']}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyCircle} />
              <Text style={styles.emptyTitle}>{emptyMsg.title}</Text>
              <Text style={styles.emptySub}>{emptyMsg.sub}</Text>
            </View>
          }
        />
      )}

      {/* Modal détail point */}
      <Modal visible={!!detailModal} animationType="slide" presentationStyle="pageSheet">
        {detailModal && (() => {
          const pt    = detailModal
          const items = parseItems(pt.items)
          const done  = pt.status === 'delivered' || pt.status === 'failed'

          return (
            <View style={styles.modal}>
              <View style={styles.modalHandle} />
              <ScrollView>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalClientName}>{pt.clientName}</Text>
                    <Text style={styles.modalAddr}>{pt.address}</Text>
                  </View>
                  <StatusBadge status={pt.status} />
                </View>

                <View style={styles.detailSection}>
                  <InfoRow label="Adresse"       value={pt.address} />
                  {pt.pickupAddress && <InfoRow label="Recuperer chez" value={pt.pickupAddress} />}
                  {pt.totalPrice    && <InfoRow label="Montant"         value={`${pt.totalPrice} MAD`} />}
                  {pt.failureNote   && <InfoRow label="Raison echec"    value={pt.failureNote} />}
                </View>

                {items.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Articles</Text>
                    {items.map((it, i) => (
                      <View key={i} style={styles.itemRow}>
                        {it.photo && (
                          <Image source={{ uri: it.photo }} style={styles.itemThumb} />
                        )}
                        <Text style={styles.itemName}>{it.name}</Text>
                        {it.qty   && <Text style={styles.itemQty}>x{it.qty}</Text>}
                        {it.price && <Text style={styles.itemPrice}>{it.price * (it.qty || 1)} MAD</Text>}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                {!done && (
                  <>
                    <TouchableOpacity
                      style={[styles.deliveredBtnLg, updatingId === pt.id && styles.btnDisabled]}
                      onPress={() => updateStatus(pt.id, 'delivered')}
                      disabled={!!updatingId}
                    >
                      {updatingId === pt.id
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.deliveredBtnText}>Marquer comme livré</Text>
                      }
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.failedBtnLg}
                      onPress={() => { setDetailModal(null); handleFail(pt) }}
                    >
                      <Text style={styles.failedBtnText}>Signaler un echec</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.navBtn}
                      onPress={() => { setDetailModal(null); navigation?.navigate('Map', { point: pt }) }}
                    >
                      <Text style={styles.navBtnText}>Voir l'itinéraire</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailModal(null)}>
                  <Text style={styles.closeBtnText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })()}
      </Modal>

      {/* Modal raison d'échec */}
      <Modal visible={failModal} animationType="fade" transparent>
        <View style={styles.failOverlay}>
          <View style={styles.failSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.failTitle}>Raison de l'échec</Text>
            <Text style={styles.failSub}>Sélectionnez la raison pour journaliser l'échec</Text>

            {FAILURE_REASONS.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.failOption, failNote === r && styles.failOptionActive]}
                onPress={() => setFailNote(r)}
              >
                <View style={[styles.radio, failNote === r && styles.radioActive]} />
                <Text style={[styles.failOptionText, failNote === r && styles.failOptionTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.failBtns}>
              <TouchableOpacity style={styles.failCancel} onPress={() => setFailModal(false)}>
                <Text style={styles.failCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.failConfirm} onPress={confirmFail}>
                <Text style={styles.failConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Sous-composant ───────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

// ─── Palette & tokens ──────────────────────────────────────────────────────────
const C = {
  brand:    '#FF6B35',   // orange Glovo-like
  dark:     '#1A1A2E',   // noir profond
  green:    '#00B14F',   // vert succès
  red:      '#EF4444',
  bg:       '#F7F8FA',
  card:     '#FFFFFF',
  border:   '#EDEEF2',
  textPrimary:   '#1A1A2E',
  textSecondary: '#8A8FA8',
  textMuted:     '#B5B9CC',
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  list: { paddingBottom: 48 },

  // ── App Bar
  appBar: {
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  appBarGreet: { fontSize: 12, color: C.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  appBarTitle: { fontSize: 22, fontWeight: '800', color: C.dark, letterSpacing: -0.5 },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E6F9EE', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#B3EED0',
  },
  gpsDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  gpsText: { fontSize: 10, fontWeight: '700', color: C.green, letterSpacing: 0.5 },

  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  iconBtnDanger: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  iconBtnText: { fontSize: 14, fontWeight: '700', color: C.dark },

  // ── Stats
  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 16,
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  statCard: {
    flex: 1, paddingVertical: 16, alignItems: 'center',
  },
  statCardMiddle: {
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border,
  },
  statVal:   { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  statLabel: { fontSize: 11, color: C.textSecondary, marginTop: 2, fontWeight: '600' },

  // ── Tabs
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 4, gap: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  tabActive: { backgroundColor: C.brand },
  tabText: { fontSize: 13, fontWeight: '700', color: C.textSecondary },
  tabTextActive: { color: '#fff' },
  tabBadge: {
    backgroundColor: C.brand, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // ── Available card
  availCard: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.dark, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },
  availHeader: {
    backgroundColor: '#FFF4EF',
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#FFE4D6',
  },
  newBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.brand },
  newBadgeText: { fontSize: 10, fontWeight: '800', color: C.brand, letterSpacing: 1 },
  availDate: { fontSize: 11, color: C.textMuted },
  availBody: { padding: 16 },

  clientName: { fontSize: 16, fontWeight: '800', color: C.dark, marginBottom: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 5 },
  addressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.textSecondary, marginTop: 5, flexShrink: 0 },
  addressText: { fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 18 },

  availFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 14, marginTop: 8, borderTopWidth: 1, borderTopColor: C.border,
  },
  priceText: { fontSize: 20, fontWeight: '800', color: C.dark, letterSpacing: -0.5 },
  acceptBtn: {
    backgroundColor: C.brand, borderRadius: 12,
    paddingHorizontal: 22, paddingVertical: 12,
  },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },

  // ── My Order card
  myOrderCard: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  myOrderHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: C.border,
  },
  myOrderTitle: { fontSize: 14, fontWeight: '700', color: C.dark, textTransform: 'capitalize' },
  myOrderSub:   { fontSize: 12, color: C.textSecondary, marginTop: 2 },

  ptCard: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  ptCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  seqBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F0F1F8',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  seqText: { fontSize: 12, fontWeight: '800', color: C.dark },
  ptClientName: { fontSize: 14, fontWeight: '700', color: C.dark },
  ptAddr:    { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  ptPickup:  { fontSize: 11, color: C.brand, marginTop: 2 },
  ptPrice:   { fontSize: 12, fontWeight: '800', color: C.brand, marginLeft: 4 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  chip:     { backgroundColor: '#F7F8FA', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  chipText: { fontSize: 11, color: C.textPrimary, fontWeight: '600' },
  chipBlue: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipBlueText: { fontSize: 11, color: '#4F6EF7', fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  deliveredBtn: {
    flex: 1, backgroundColor: C.green, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
  },
  deliveredBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  failedBtn: {
    backgroundColor: '#FEF2F2', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  failedBtnText: { color: C.red, fontSize: 13, fontWeight: '700' },
  mapBtn: {
    backgroundColor: '#F0F1F8', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center',
  },
  mapBtnText: { fontSize: 12, fontWeight: '700', color: C.dark },
  btnDisabled: { opacity: 0.45 },

  // ── Empty
  empty: {
    alignItems: 'center', paddingVertical: 60,
    backgroundColor: C.card, marginHorizontal: 16, marginTop: 12,
    borderRadius: 18, borderWidth: 1, borderColor: C.border,
  },
  emptyCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#F0F1F8', marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.dark },
  emptySub:   { fontSize: 13, color: C.textSecondary, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },

  // ── Modal
  modal: { flex: 1, backgroundColor: C.card, paddingTop: 12 },
  modalHandle: {
    width: 36, height: 4, backgroundColor: C.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 20, gap: 12,
  },
  modalClientName: { fontSize: 20, fontWeight: '800', color: C.dark },
  modalAddr:       { fontSize: 13, color: C.textSecondary, marginTop: 3 },

  detailSection: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: '#FAFAFA', borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: C.textSecondary,
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoLabel: { fontSize: 13, color: C.textSecondary, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '700', color: C.dark, flex: 2, textAlign: 'right' },

  itemRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  itemThumb: { width: 38, height: 38, borderRadius: 8 },
  itemName:  { flex: 2, fontSize: 13, color: C.textPrimary },
  itemQty:   { fontSize: 13, color: C.textSecondary },
  itemPrice: { fontSize: 13, fontWeight: '800', color: C.green },

  modalActions: { padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: C.border },
  deliveredBtnLg: {
    backgroundColor: C.green, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  failedBtnLg: {
    backgroundColor: '#FEF2F2', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  navBtn: {
    backgroundColor: '#F0F1F8', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  navBtnText:  { color: C.dark, fontSize: 14, fontWeight: '700' },
  closeBtn:    { paddingVertical: 14, alignItems: 'center', borderRadius: 14, backgroundColor: C.bg },
  closeBtnText:{ fontSize: 15, fontWeight: '600', color: C.textSecondary },

  // ── Fail Modal
  failOverlay: { flex: 1, backgroundColor: 'rgba(26,26,46,0.5)', justifyContent: 'flex-end' },
  failSheet: {
    backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 44,
  },
  failTitle: { fontSize: 18, fontWeight: '800', color: C.dark, marginBottom: 4 },
  failSub:   { fontSize: 13, color: C.textSecondary, marginBottom: 20 },
  failOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  failOptionActive: { },
  radio:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border },
  radioActive: { borderColor: C.brand, backgroundColor: C.brand },
  failOptionText:       { fontSize: 15, color: C.textPrimary },
  failOptionTextActive: { color: C.brand, fontWeight: '700' },
  failBtns:    { flexDirection: 'row', gap: 12, marginTop: 24 },
  failCancel:  {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.bg, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  failCancelText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
  failConfirm:    { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.brand, alignItems: 'center' },
  failConfirmText:{ fontSize: 14, fontWeight: '800', color: '#fff' },
})
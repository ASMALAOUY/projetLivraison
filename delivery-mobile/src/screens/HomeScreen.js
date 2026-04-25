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
      setAvailable(avRes.data || [])
      setMyOrders(myRes.data || [])
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
      Alert.alert('✅ Succès', 'Commande acceptée !')
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
  // RENDU : Carte commande disponible — reçoit un DeliveryPoint directement
  // ════════════════════════════════════════════════════════════════════════════
  const renderAvailable = ({ item: point }) => {
    const items = parseItems(point.items)

    return (
      <View style={styles.availCard}>
        <View style={styles.availHeader}>
          <View style={styles.availPulseRow}>
            <View style={styles.pulseOrange} />
            <Text style={styles.availHeaderText}>NOUVELLE COMMANDE</Text>
          </View>
          <Text style={styles.availDate}>
            {point.createdAt
              ? new Date(point.createdAt).toLocaleDateString('fr-FR')
              : ''}
          </Text>
        </View>

        <View style={styles.availBody}>
          <Text style={styles.ptClient}>{point.clientName || 'Client'}</Text>

          <View style={styles.ptRow}>
            <Text style={styles.ptIcon}>🏠</Text>
            <Text style={styles.ptAddr}>{point.address}</Text>
          </View>

          {!!point.pickupAddress && (
            <View style={styles.ptRow}>
              <Text style={styles.ptIcon}>📍</Text>
              <Text style={styles.ptPickup}>Récupérer chez : {point.pickupAddress}</Text>
            </View>
          )}

          {items.length > 0 && (
            <View style={styles.chipsRow}>
              {items.map((it, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{it.name} ×{it.qty}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.availFooter}>
            {point.totalPrice
              ? <Text style={styles.availTotal}>{point.totalPrice} MAD</Text>
              : <View />
            }
            <TouchableOpacity
              style={[styles.acceptBtn, accepting === point.id && styles.btnDisabled]}
              onPress={() => acceptOrder(point.id)}
              disabled={!!accepting}
            >
              {accepting === point.id
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.acceptBtnText}>✓ Accepter</Text>
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
              Livraison — {order.date
                ? new Date(order.date).toLocaleDateString('fr-FR')
                : ''}
            </Text>
            <Text style={styles.myOrderSub}>{points.length} point(s)</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        {points.map(pt => {
          const items = parseItems(pt.items)
          const done  = pt.status === 'delivered' || pt.status === 'failed'

          return (
            <TouchableOpacity
              key={pt.id}
              style={styles.ptCard}
              onPress={() => setDetailModal(pt)}
              activeOpacity={0.85}
            >
              <View style={styles.ptCardHeader}>
                <View style={styles.seqBadge}>
                  <Text style={styles.seqText}>{pt.sequence}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ptClientBold}>{pt.clientName}</Text>
                  <Text style={styles.ptAddrSm} numberOfLines={1}>{pt.address}</Text>
                  {pt.pickupAddress
                    ? <Text style={styles.ptPickupSm}>📍 {pt.pickupAddress}</Text>
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
                        {it.name}{it.qty ? ` ×${it.qty}` : ''}
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
                      : <Text style={styles.deliveredBtnText}>✓ Livré</Text>
                    }
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.failedBtn, updatingId === pt.id && styles.btnDisabled]}
                    onPress={() => handleFail(pt)}
                    disabled={!!updatingId}
                  >
                    <Text style={styles.failedBtnText}>✗ Échec</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => navigation?.navigate('Map', { point: pt })}
                  >
                    <Text style={styles.mapBtnText}>🗺</Text>
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
          <Text style={styles.appBarTitle}>Livraisons</Text>
          <Text style={styles.appBarSub}>Bonjour, {user?.name?.split(' ')[0]} 👋</Text>
        </View>
        <View style={styles.appBarRight}>
          {gpsOn && (
            <View style={styles.gpsBadge}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>GPS actif</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => loadData(true)} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {myOrders.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#16A34A' }]}>{delivered}</Text>
            <Text style={styles.statLabel}>Livrés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#2563EB' }]}>{inProgress}</Text>
            <Text style={styles.statLabel}>En cours</Text>
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
            <View style={styles.tabBadgeRed}>
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
            <View style={styles.tabBadgeBlue}>
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
    ? { icon: '📭', title: 'Aucune commande disponible', sub: 'Les nouvelles commandes apparaissent ici' }
    : { icon: '🚴', title: 'Aucune livraison en cours',  sub: 'Acceptez une commande dans le premier onglet' }

  return (
    <View style={styles.root}>
      {loading ? (
        <>
          <ListHeader />
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 60 }} />
        </>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData() }}
              colors={['#2563EB']}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{emptyMsg.icon}</Text>
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
                  <Text style={styles.modalTitle}>{pt.clientName}</Text>
                  <StatusBadge status={pt.status} />
                </View>

                <View style={styles.infoBlock}>
                  <InfoRow label="🏠 Adresse"     value={pt.address} />
                  {pt.pickupAddress && <InfoRow label="📍 Récupérer chez" value={pt.pickupAddress} />}
                  {pt.totalPrice    && <InfoRow label="💰 Montant"         value={`${pt.totalPrice} MAD`} />}
                  {pt.failureNote   && <InfoRow label="⚠️ Raison échec"    value={pt.failureNote} />}
                </View>

                {items.length > 0 && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoBlockTitle}>Articles commandés</Text>
                    {items.map((it, i) => (
                      <View key={i} style={styles.itemRow}>
                        {it.photo && (
                          <Image source={{ uri: it.photo }} style={styles.itemThumb} />
                        )}
                        <Text style={styles.itemName}>{it.name}</Text>
                        {it.qty   && <Text style={styles.itemQty}>×{it.qty}</Text>}
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
                      style={[styles.deliveredBtn, { paddingVertical: 14 }, updatingId === pt.id && styles.btnDisabled]}
                      onPress={() => updateStatus(pt.id, 'delivered')}
                      disabled={!!updatingId}
                    >
                      {updatingId === pt.id
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.deliveredBtnText}>✓ Marquer comme Livré</Text>
                      }
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.failedBtn}
                      onPress={() => { setDetailModal(null); handleFail(pt) }}
                    >
                      <Text style={styles.failedBtnText}>✗ Signaler un échec</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.navBtn}
                      onPress={() => { setDetailModal(null); navigation?.navigate('Map', { point: pt }) }}
                    >
                      <Text style={styles.navBtnText}>🗺 Voir l'itinéraire</Text>
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
          <View style={styles.failCard}>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  list: { paddingBottom: 40 },

  appBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  appBarTitle:  { fontSize: 22, fontWeight: '800', color: '#111827' },
  appBarSub:    { fontSize: 13, color: '#6B7280', marginTop: 2 },
  appBarRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },

  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  gpsDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  gpsText: { fontSize: 10, fontWeight: '600', color: '#16A34A' },

  refreshBtn: {
    borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  refreshBtnText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },

  logoutBtn: {
    backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#FECACA',
  },
  logoutBtnText: { fontSize: 14, color: '#DC2626', fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 14 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6',
  },
  statVal:   { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  tabs: {
    flexDirection: 'row', margin: 16, backgroundColor: '#E5E7EB',
    borderRadius: 14, padding: 4, gap: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  tabActive:      { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText:        { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tabTextActive:  { color: '#1D4ED8' },
  tabBadgeRed:    { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeBlue:   { backgroundColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText:   { color: '#fff', fontSize: 10, fontWeight: '700' },

  availCard: {
    marginHorizontal: 16, marginBottom: 14, borderRadius: 20,
    borderWidth: 2, borderColor: '#FED7AA', backgroundColor: '#fff',
    overflow: 'hidden', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  availHeader: {
    backgroundColor: '#FFF7ED', paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  availPulseRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pulseOrange:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FB923C' },
  availHeaderText:{ fontSize: 11, fontWeight: '800', color: '#C2410C', letterSpacing: 0.5 },
  availDate:      { fontSize: 11, color: '#9CA3AF' },
  availBody:      { padding: 16 },

  ptClient:  { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 5 },
  ptRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  ptIcon:    { fontSize: 14, marginTop: 1 },
  ptAddr:    { fontSize: 13, color: '#6B7280', flex: 1 },
  ptPickup:  { fontSize: 13, color: '#EA580C', flex: 1 },

  availFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  availTotal: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  acceptBtn: {
    backgroundColor: '#22C55E', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  myOrderCard: {
    marginHorizontal: 16, marginBottom: 14, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden',
  },
  myOrderHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  myOrderTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  myOrderSub:   { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  ptCard: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  ptCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  seqBadge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  seqText:      { fontSize: 12, fontWeight: '800', color: '#1D4ED8' },
  ptClientBold: { fontSize: 14, fontWeight: '700', color: '#111827' },
  ptAddrSm:     { fontSize: 12, color: '#6B7280', marginTop: 2 },
  ptPickupSm:   { fontSize: 11, color: '#EA580C', marginTop: 1 },
  ptPrice:      { fontSize: 12, fontWeight: '700', color: '#2563EB', marginLeft: 4 },

  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  chip:         { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipText:     { fontSize: 11, color: '#374151', fontWeight: '500' },
  chipBlue:     { backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipBlueText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  deliveredBtn: {
    flex: 1, backgroundColor: '#22C55E', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
  },
  deliveredBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  failedBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  failedBtnText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
  mapBtn:     { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  mapBtnText: { fontSize: 16 },
  btnDisabled:{ opacity: 0.5 },
  navBtn:     { backgroundColor: '#EFF6FF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  navBtnText: { color: '#1D4ED8', fontSize: 14, fontWeight: '600' },

  empty: {
    alignItems: 'center', paddingVertical: 60,
    backgroundColor: '#fff', marginHorizontal: 16,
    borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6',
  },
  emptyIcon:  { fontSize: 48, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub:   { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },

  modal:       { flex: 1, backgroundColor: '#fff', paddingTop: 12 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 16, gap: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 },

  infoBlock:      { backgroundColor: '#F9FAFB', borderRadius: 16, marginHorizontal: 16, marginBottom: 14, padding: 16 },
  infoBlockTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  infoRow:        { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel:      { fontSize: 13, color: '#6B7280', flex: 1 },
  infoValue:      { fontSize: 13, fontWeight: '600', color: '#111827', flex: 2, textAlign: 'right' },

  itemRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', gap: 10 },
  itemThumb: { width: 40, height: 40, borderRadius: 8 },
  itemName:  { flex: 2, fontSize: 13, color: '#374151' },
  itemQty:   { fontSize: 13, color: '#6B7280' },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#059669' },

  modalActions: { padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  closeBtn:     { paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#F3F4F6' },
  closeBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },

  failOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  failCard:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  failTitle:   { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  failSub:     { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  failOption:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  failOptionActive:     { backgroundColor: '#FEF2F2', marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 10 },
  radio:                { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB' },
  radioActive:          { borderColor: '#DC2626', backgroundColor: '#DC2626' },
  failOptionText:       { fontSize: 15, color: '#374151' },
  failOptionTextActive: { color: '#DC2626', fontWeight: '700' },
  failBtns:    { flexDirection: 'row', gap: 12, marginTop: 20 },
  failCancel:  { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' },
  failCancelText:  { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  failConfirm:     { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#DC2626', alignItems: 'center' },
  failConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
})
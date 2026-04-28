import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, FlatList, Linking,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../api/api';
import StatusBadge from '../components/StatusBadge';

// ─── Palette ─────────────────────────────────────────────────────────────────
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
}

export default function MapScreen({ navigation }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await api.get('/drivers/me/orders');
        setOrders(data);
        await Location.requestForegroundPermissionsAsync();
      } catch {}
      setLoading(false);
    };
    loadData();
  }, []);

  const allPoints = orders
    .flatMap(o => (o.DeliveryPoints || []).map(p => ({ ...p, orderDate: o.date })))
    .sort((a, b) => a.sequence - b.sequence);

  const nextPoint = allPoints.find(p => p.status === 'pending' || p.status === 'in_progress');

  const openGoogleMaps = (lat, lng) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={s.loadTxt}>Chargement de l'itineraire...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Itineraire</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeTxt}>{allPoints.length} pts</Text>
        </View>
      </View>

      {/* Next stop card */}
      {nextPoint ? (
        <View style={s.nextCard}>
          <View style={s.nextLabelRow}>
            <View style={s.nextDot} />
            <Text style={s.nextLabel}>PROCHAIN ARRET</Text>
          </View>
          <Text style={s.nextName}>{nextPoint.clientName}</Text>
          <Text style={s.nextAddr}>{nextPoint.address}</Text>
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => openGoogleMaps(nextPoint.latitude, nextPoint.longitude)}
          >
            <Text style={s.navBtnTxt}>Ouvrir dans Google Maps</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.allDoneCard}>
          <View style={s.allDoneIconBox}>
            <View style={s.allDoneCheck} />
          </View>
          <Text style={s.allDoneTxt}>Tous les points livrés !</Text>
        </View>
      )}

      {/* Section title */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>TOUS LES POINTS</Text>
        <View style={s.countBadge}>
          <Text style={s.countBadgeTxt}>{allPoints.length}</Text>
        </View>
      </View>

      {/* Points list */}
      <FlatList
        data={allPoints}
        keyExtractor={p => p.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item: pt }) => {
          const isNext = pt.id === nextPoint?.id;
          const isDone = pt.status === 'delivered';
          return (
            <View style={[s.ptRow, isNext && s.ptRowActive, isDone && s.ptRowDone]}>
              <View style={[
                s.seqBadge,
                isDone && s.seqBadgeDone,
                isNext && s.seqBadgeNext,
              ]}>
                <Text style={[s.seqTxt, (isDone || isNext) && { color: '#fff' }]}>
                  {isDone ? '✓' : pt.sequence}
                </Text>
              </View>
              <View style={s.ptInfo}>
                <Text style={s.ptName}>{pt.clientName}</Text>
                <Text style={s.ptAddr} numberOfLines={1}>{pt.address}</Text>
              </View>
              <View style={s.ptRight}>
                <StatusBadge status={pt.status} />
                {!isDone && (
                  <TouchableOpacity
                    style={s.gpsBtn}
                    onPress={() => openGoogleMaps(pt.latitude, pt.longitude)}
                  >
                    <Text style={s.gpsTxt}>GPS</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <View style={s.emptyCircle} />
            <Text style={s.emptyTxt}>Aucun point de livraison</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  loadTxt: { marginTop: 14, color: C.textSecondary, fontSize: 14 },

  // Header
  header: {
    backgroundColor: C.dark,
    paddingTop: 54, paddingBottom: 18, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 3, borderBottomColor: C.brand,
  },
  backBtn:        { paddingVertical: 6, paddingRight: 12 },
  backTxt:        { color: C.brand, fontSize: 14, fontWeight: '700' },
  headerTitle:    { fontSize: 16, fontWeight: '900', color: '#fff', flex: 1, textAlign: 'center', letterSpacing: -0.3 },
  headerBadge:    { backgroundColor: C.brand, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  headerBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // Next stop
  nextCard: {
    margin: 16, borderRadius: 20,
    backgroundColor: C.brand, padding: 20,
  },
  nextLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  nextDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.7)' },
  nextLabel:    { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5 },
  nextName:     { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 5, letterSpacing: -0.3 },
  nextAddr:     { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 18, lineHeight: 18 },
  navBtn:       { backgroundColor: C.dark, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  navBtnTxt:    { color: '#fff', fontWeight: '800', fontSize: 14 },

  // All done
  allDoneCard: {
    margin: 16, borderRadius: 20,
    backgroundColor: '#E8FBF0', padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5, borderColor: '#B3EED0',
  },
  allDoneIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.green,
    alignItems: 'center', justifyContent: 'center',
  },
  allDoneCheck: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  allDoneTxt: { fontSize: 15, fontWeight: '800', color: '#1D6A3A' },

  // Section
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 10, marginTop: 4,
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: C.textSecondary, letterSpacing: 1.5 },
  countBadge:   { backgroundColor: C.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  countBadgeTxt:{ fontSize: 11, fontWeight: '800', color: C.textSecondary },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Point row
  ptRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, backgroundColor: C.card,
    borderRadius: 16, marginBottom: 8,
    borderWidth: 1.5, borderColor: C.border,
  },
  ptRowActive: { borderColor: C.brand, backgroundColor: '#FFF4EF' },
  ptRowDone:   { borderColor: '#B3EED0', backgroundColor: '#E8FBF0', opacity: 0.8 },

  seqBadge: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F0F1F8',
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  seqBadgeDone: { backgroundColor: C.green, borderColor: C.green },
  seqBadgeNext: { backgroundColor: C.brand, borderColor: C.brand },
  seqTxt:       { fontSize: 13, fontWeight: '800', color: C.dark },

  ptInfo: { flex: 1 },
  ptName: { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 2 },
  ptAddr: { fontSize: 12, color: C.textSecondary },

  ptRight: { alignItems: 'flex-end', gap: 6 },
  gpsBtn: {
    backgroundColor: '#FFF4EF', borderWidth: 1, borderColor: C.brand,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  gpsTxt: { fontSize: 11, fontWeight: '800', color: C.brand },

  emptyBox:   { alignItems: 'center', paddingVertical: 60, gap: 14 },
  emptyCircle:{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.border },
  emptyTxt:   { fontSize: 14, fontWeight: '600', color: C.textSecondary },
});
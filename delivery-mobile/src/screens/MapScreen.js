import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, FlatList, Linking,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../api/api';
import StatusBadge from '../components/StatusBadge';

const Y = '#F59E0B', F = '#D97706', DARK = '#1A1A18'

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
        <ActivityIndicator size="large" color={Y} />
        <Text style={s.loadTxt}>Chargement de l'itinéraire…</Text>
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
        <Text style={s.headerTitle}>Mon itinéraire</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeTxt}>{allPoints.length} pts</Text>
        </View>
      </View>

      {/* Next stop card */}
      {nextPoint ? (
        <View style={s.nextCard}>
          <View style={s.nextLabelRow}>
            <View style={s.nextDot} />
            <Text style={s.nextLabel}>PROCHAIN ARRÊT</Text>
          </View>
          <Text style={s.nextName}>{nextPoint.clientName}</Text>
          <Text style={s.nextAddr}>{nextPoint.address}</Text>
          <TouchableOpacity style={s.navBtn}
            onPress={() => openGoogleMaps(nextPoint.latitude, nextPoint.longitude)}>
            <Text style={s.navBtnTxt}>🗺 Ouvrir dans Google Maps</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.allDoneCard}>
          <Text style={s.allDoneIcon}></Text>
          <Text style={s.allDoneTxt}>Tous les points livrés !</Text>
        </View>
      )}

      {/* Section title */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>TOUS LES POINTS</Text>
        <Text style={s.sectionCount}>{allPoints.length}</Text>
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
              <View style={[s.seqBadge, isDone && s.seqBadgeDone, isNext && s.seqBadgeActive]}>
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
                  <TouchableOpacity style={s.gpsBtn}
                    onPress={() => openGoogleMaps(pt.latitude, pt.longitude)}>
                    <Text style={s.gpsTxt}>GPS</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}></Text>
            <Text style={s.emptyTxt}>Aucun point de livraison</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#FAFAF8' },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF8' },
  loadTxt:  { marginTop: 12, color: '#888', fontSize: 14 },

  header:       { backgroundColor: DARK, paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 3, borderBottomColor: Y },
  backBtn:      { paddingVertical: 6, paddingRight: 12 },
  backTxt:      { color: Y, fontSize: 14, fontWeight: '700' },
  headerTitle:  { fontSize: 16, fontWeight: '900', color: '#fff', flex: 1, textAlign: 'center' },
  headerBadge:  { backgroundColor: Y, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  headerBadgeTxt:{ fontSize: 11, fontWeight: '800', color: DARK },

  nextCard:     { margin: 16, backgroundColor: Y, borderRadius: 20, padding: 20 },
  nextLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  nextDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: DARK },
  nextLabel:    { fontSize: 10, fontWeight: '800', color: DARK, letterSpacing: 1.5 },
  nextName:     { fontSize: 20, fontWeight: '900', color: DARK, marginBottom: 4, letterSpacing: -0.3 },
  nextAddr:     { fontSize: 13, color: 'rgba(26,26,24,0.65)', marginBottom: 16, lineHeight: 18 },
  navBtn:       { backgroundColor: DARK, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  navBtnTxt:    { color: Y, fontWeight: '800', fontSize: 14 },

  allDoneCard:  { margin: 16, backgroundColor: '#F0FDF4', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#BBF7D0' },
  allDoneIcon:  { fontSize: 32, marginBottom: 8 },
  allDoneTxt:   { fontSize: 15, fontWeight: '800', color: '#16A34A' },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: F, letterSpacing: 1.5 },
  sectionCount: { fontSize: 11, fontWeight: '800', color: '#CCC', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  listContent:  { paddingHorizontal: 16, paddingBottom: 40 },

  ptRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#fff', borderRadius: 16, marginBottom: 8, borderWidth: 1.5, borderColor: '#EBEBEB' },
  ptRowActive: { borderColor: Y, backgroundColor: '#FFFBEB' },
  ptRowDone:   { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4', opacity: 0.75 },
  seqBadge:    { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: Y, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  seqBadgeDone:{ backgroundColor: '#22C55E', borderColor: '#22C55E' },
  seqBadgeActive:{ backgroundColor: Y, borderColor: Y },
  seqTxt:      { fontSize: 13, fontWeight: '800', color: F },
  ptInfo:      { flex: 1 },
  ptName:      { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 2 },
  ptAddr:      { fontSize: 12, color: '#999' },
  ptRight:     { alignItems: 'flex-end', gap: 6 },
  gpsBtn:      { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: Y, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  gpsTxt:      { fontSize: 11, fontWeight: '800', color: F },
  emptyBox:    { alignItems: 'center', paddingVertical: 48 },
  emptyIcon:   { fontSize: 40, marginBottom: 10 },
  emptyTxt:    { fontSize: 14, fontWeight: '600', color: '#888' },
});
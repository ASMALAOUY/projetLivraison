import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, FlatList, Linking, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../api/api';
import StatusBadge from '../components/StatusBadge';

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

export default function MapScreen({ navigation, route }) {
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

  // Si on arrive depuis HomeScreen avec un point précis
  const focusPoint = route?.params?.point;
  const nextPoint  = focusPoint
    || allPoints.find(p => p.status === 'pending' || p.status === 'in_progress');

  // ── Navigation Google Maps ─────────────────────────────────────────────────
  // Priorité 1 : coordonnées GPS valides → navigation directe (plus précis)
  // Priorité 2 : adresse texte → recherche Google Maps (comme Glovo/Uber Eats)
  const openNavigation = async (point) => {
    if (!point) return;

    const lat = parseFloat(point.latitude);
    const lng = parseFloat(point.longitude);
    // Coordonnees valides = ni NaN, ni le fallback generique du centre-ville
    const isFallback = (lat === 31.6295 && lng === -7.9811);
    const hasRealCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && !isFallback;

    // ── Priorite 1 : vraies coordonnees GPS en base ──────────────────────────
    if (hasRealCoords) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}`);
      });
      return;
    }

    // ── Priorite 2 : geocoder l'adresse en temps reel (Nominatim) ────────────
    const address = point.address || '';
    if (address.trim()) {
      try {
        const query   = encodeURIComponent(address.trim() + ', Marrakech, Maroc');
        const res     = await fetch(
          'https://nominatim.openstreetmap.org/search?q=' + query + '&format=json&limit=1',
          { headers: { 'Accept-Language': 'fr', 'User-Agent': 'DelivTrack/1.0' } }
        );
        const data    = await res.json();
        if (data && data.length > 0) {
          const gLat  = parseFloat(data[0].lat);
          const gLng  = parseFloat(data[0].lon);
          const gmUrl = `https://www.google.com/maps/dir/?api=1&destination=${gLat},${gLng}&travelmode=driving`;
          Linking.openURL(gmUrl);
          return;
        }
      } catch (e) {
        console.warn('Geocodage echoue:', e.message);
      }

      // ── Fallback : recherche par texte brut ──────────────────────────────
      const textQuery = encodeURIComponent(address.trim() + ', Marrakech, Maroc');
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${textQuery}&travelmode=driving`
      ).catch(() => Alert.alert('Erreur', "Impossible d'ouvrir Google Maps."));
      return;
    }

    Alert.alert('Adresse manquante', "Ce point n'a pas d'adresse enregistree.");
  };

  // Navigation vers le lieu de récupération (pickup)
  const openPickupNavigation = (address) => {
    if (!address) return;
    const query = encodeURIComponent(`${address.trim()}, Marrakech, Maroc`);
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`
    ).catch(() => {
      Alert.alert('Erreur', "Impossible d'ouvrir Google Maps.");
    });
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

      {/* Prochain arret */}
      {nextPoint ? (
        <View style={s.nextCard}>
          <View style={s.nextLabelRow}>
            <View style={s.nextDot} />
            <Text style={s.nextLabel}>PROCHAIN ARRET</Text>
          </View>
          <Text style={s.nextName}>{nextPoint.clientName}</Text>
          <Text style={s.nextAddr}>{nextPoint.address}</Text>

          {/* Bouton navigation livraison */}
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => openNavigation(nextPoint)}
          >
            <Text style={s.navBtnTxt}>Naviguer vers ce client</Text>
          </TouchableOpacity>

          {/* Bouton récupération si adresse différente */}
          {!!nextPoint.pickupAddress && (
            <TouchableOpacity
              style={s.pickupBtn}
              onPress={() => openPickupNavigation(nextPoint.pickupAddress)}
            >
              <Text style={s.pickupBtnTxt}>
                Retrait chez : {nextPoint.pickupAddress}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={s.allDoneCard}>
          <View style={s.allDoneCheck} />
          <Text style={s.allDoneTxt}>Tous les points livres !</Text>
        </View>
      )}

      {/* Section */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>TOUS LES POINTS</Text>
        <View style={s.countBadge}>
          <Text style={s.countTxt}>{allPoints.length}</Text>
        </View>
      </View>

      {/* Liste */}
      <FlatList
        data={allPoints}
        keyExtractor={(p, i) => `${p.id}-${i}`}
        contentContainerStyle={s.listContent}
        renderItem={({ item: pt }) => {
          const isNext = pt.id === nextPoint?.id;
          const isDone = pt.status === 'delivered';
          const isFail = pt.status === 'failed';

          return (
            <View style={[
              s.ptRow,
              isNext && s.ptRowActive,
              isDone && s.ptRowDone,
              isFail && s.ptRowFail,
            ]}>
              <View style={[
                s.seqBadge,
                isDone && s.seqBadgeDone,
                isNext && s.seqBadgeActive,
                isFail && s.seqBadgeFail,
              ]}>
                <Text style={[s.seqTxt, (isDone || isNext || isFail) && { color: '#fff' }]}>
                  {isDone ? '✓' : isFail ? '✕' : pt.sequence}
                </Text>
              </View>

              <View style={s.ptInfo}>
                <Text style={s.ptName}>{pt.clientName}</Text>
                <Text style={s.ptAddr} numberOfLines={1}>{pt.address}</Text>
                {!!pt.pickupAddress && (
                  <Text style={s.ptPickup} numberOfLines={1}>
                    Retrait : {pt.pickupAddress}
                  </Text>
                )}
              </View>

              <View style={s.ptRight}>
                <StatusBadge status={pt.status} />
                {!isDone && !isFail && (
                  <TouchableOpacity
                    style={[s.gpsBtn, isNext && s.gpsBtnActive]}
                    onPress={() => openNavigation(pt)}
                  >
                    <Text style={[s.gpsTxt, isNext && { color: '#fff' }]}>
                      GPS
                    </Text>
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

  header: {
    backgroundColor: C.dark,
    paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 3, borderBottomColor: C.brand,
  },
  backBtn:        { paddingVertical: 6, paddingRight: 12 },
  backTxt:        { color: C.brand, fontSize: 14, fontWeight: '700' },
  headerTitle:    { fontSize: 16, fontWeight: '900', color: '#fff', flex: 1, textAlign: 'center', letterSpacing: -0.3 },
  headerBadge:    { backgroundColor: C.brand, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  headerBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },

  nextCard: {
    margin: 16, borderRadius: 20,
    backgroundColor: C.brand, padding: 20,
  },
  nextLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  nextDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.7)' },
  nextLabel:    { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5 },
  nextName:     { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 5, letterSpacing: -0.3 },
  nextAddr:     { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 18, lineHeight: 18 },

  navBtn: {
    backgroundColor: C.dark, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginBottom: 10,
  },
  navBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },

  pickupBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
  },
  pickupBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },

  allDoneCard: {
    margin: 16, borderRadius: 20,
    backgroundColor: '#E8FBF0', padding: 24,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5, borderColor: '#B3EED0',
  },
  allDoneCheck: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.green },
  allDoneTxt:   { fontSize: 16, fontWeight: '800', color: '#1D6A3A' },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 10, marginTop: 4,
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: C.textSecondary, letterSpacing: 1.5 },
  countBadge:   { backgroundColor: C.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  countTxt:     { fontSize: 11, fontWeight: '800', color: C.textSecondary },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  ptRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, backgroundColor: C.card,
    borderRadius: 16, marginBottom: 8,
    borderWidth: 1.5, borderColor: C.border,
  },
  ptRowActive: { borderColor: C.brand, backgroundColor: '#FFF4EF' },
  ptRowDone:   { borderColor: '#B3EED0', backgroundColor: '#E8FBF0', opacity: 0.85 },
  ptRowFail:   { borderColor: '#FECACA', backgroundColor: '#FEF2F2', opacity: 0.85 },

  seqBadge: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F0F1F8', borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  seqBadgeDone:   { backgroundColor: C.green, borderColor: C.green },
  seqBadgeActive: { backgroundColor: C.brand, borderColor: C.brand },
  seqBadgeFail:   { backgroundColor: C.red,   borderColor: C.red   },
  seqTxt:         { fontSize: 13, fontWeight: '800', color: C.dark },

  ptInfo:   { flex: 1 },
  ptName:   { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 2 },
  ptAddr:   { fontSize: 12, color: C.textSecondary },
  ptPickup: { fontSize: 11, color: C.brand, marginTop: 2 },

  ptRight:      { alignItems: 'flex-end', gap: 6 },
  gpsBtn:       { backgroundColor: '#FFF4EF', borderWidth: 1.5, borderColor: C.brand, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9 },
  gpsBtnActive: { backgroundColor: C.brand },
  gpsTxt:       { fontSize: 11, fontWeight: '800', color: C.brand },

  emptyBox:   { alignItems: 'center', paddingVertical: 60, gap: 14 },
  emptyCircle:{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.border },
  emptyTxt:   { fontSize: 14, fontWeight: '600', color: C.textSecondary },
});
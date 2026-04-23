import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, FlatList,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../api/api';
import StatusBadge from '../components/StatusBadge';

export default function MapScreen({ navigation }) {
  const [orders,   setOrders]   = useState([]);
  const [myLoc,    setMyLoc]    = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await api.get('/drivers/me/orders');
      setOrders(data);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setMyLoc(loc.coords);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const allPoints = orders.flatMap(o =>
    (o.DeliveryPoints || []).map(p => ({ ...p, orderDate: o.date }))
  ).sort((a, b) => a.sequence - b.sequence);

  const nextPoint = allPoints.find(p => p.status === 'pending' || p.status === 'in_progress');

  const openGoogleMaps = (lat, lng, address) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    require('react-native').Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadTxt}>Chargement de l'itinéraire…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon itinéraire</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Prochain point */}
      {nextPoint && (
        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>Prochain arrêt</Text>
          <Text style={styles.nextName}>{nextPoint.clientName}</Text>
          <Text style={styles.nextAddr}>{nextPoint.address}</Text>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => openGoogleMaps(nextPoint.latitude, nextPoint.longitude, nextPoint.address)}
          >
            <Text style={styles.navBtnTxt}>Ouvrir dans Google Maps</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste de tous les points */}
      <Text style={styles.sectionTitle}>Tous les points ({allPoints.length})</Text>
      <FlatList
        data={allPoints}
        keyExtractor={p => p.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item: pt, index }) => (
          <View style={[styles.pointRow, pt.id === nextPoint?.id && styles.pointRowActive]}>
            <View style={[styles.seqCircle, pt.status === 'delivered' && styles.seqDone]}>
              <Text style={styles.seqNum}>{pt.sequence}</Text>
            </View>
            {index < allPoints.length - 1 && <View style={styles.connector} />}
            <View style={styles.pointInfo}>
              <Text style={styles.pointName}>{pt.clientName}</Text>
              <Text style={styles.pointAddr}>{pt.address}</Text>
            </View>
            <View style={styles.pointRight}>
              <StatusBadge status={pt.status} />
              {pt.status !== 'delivered' && (
                <TouchableOpacity
                  style={styles.dirBtn}
                  onPress={() => openGoogleMaps(pt.latitude, pt.longitude)}>
                  <Text style={styles.dirTxt}>GPS</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8FAFC' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadTxt:      { marginTop: 12, color: '#6B7280' },
  header:       { backgroundColor: '#2563EB', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back:         { color: '#fff', fontSize: 14, fontWeight: '600' },
  headerTitle:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  nextCard:     { margin: 16, backgroundColor: '#2563EB', borderRadius: 16, padding: 18 },
  nextLabel:    { fontSize: 11, color: '#BFDBFE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  nextName:     { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  nextAddr:     { fontSize: 13, color: '#BFDBFE', marginBottom: 14 },
  navBtn:       { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  navBtnTxt:    { color: '#2563EB', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  pointRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  pointRowActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  seqCircle:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  seqDone:      { backgroundColor: '#DCFCE7' },
  seqNum:       { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  connector:    { display: 'none' },
  pointInfo:    { flex: 1 },
  pointName:    { fontSize: 14, fontWeight: '600', color: '#111827' },
  pointAddr:    { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  pointRight:   { alignItems: 'flex-end', gap: 6 },
  dirBtn:       { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  dirTxt:       { fontSize: 11, fontWeight: '700', color: '#2563EB' },
});
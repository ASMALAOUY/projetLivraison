import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import api from '../api/api';
import useAuthStore from '../store/authStore';

const Y = '#F59E0B', F = '#D97706', DARK = '#1A1A18'

const ROLES = [
  { key: 'driver', label: ' Livreur', field: 'phone' },
  { key: 'client', label: ' Client',  field: 'email' },
];

export default function LoginScreen({ navigation }) {
  const [role, setRole]       = useState('client');
  const [identifier, setId]   = useState('');
  const [password, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const current = ROLES.find(r => r.key === role);

  const handleLogin = async () => {
    if (!identifier || !password) { Alert.alert('Erreur', 'Veuillez remplir tous les champs'); return; }
    setLoading(true);
    try {
      const body = { password, role, [current.field]: identifier };
      const { data } = await api.post('/auth/login', body);
      await login(data.token, data.user);
      if (data.user.role === 'driver') navigation.replace('Home');
      else if (data.user.role === 'client') navigation.replace('ClientTracking');
      else navigation.replace('Home');
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.error || 'Identifiants invalides');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Brand */}
        <View style={s.brandBox}>
          <View style={s.brandIcon}><Text style={s.brandEmoji}></Text></View>
          <Text style={s.brandName}>DelivTrack</Text>
          <View style={s.cityBadge}>
            <View style={s.cityDot} />
            <Text style={s.cityText}>Marrakech</Text>
          </View>
        </View>

        {/* Hero */}
        <Text style={s.title}>Bon retour,{'\n'}<Text style={s.accent}>connectez-vous.</Text></Text>
        <Text style={s.sub}>Livraison rapide · Suivi GPS · Paiement livraison</Text>

        {/* Role tabs */}
        <View style={s.roleTabs}>
          {ROLES.map(r => (
            <TouchableOpacity key={r.key} onPress={() => { setRole(r.key); setId(''); }}
              style={[s.roleTab, role === r.key && s.roleTabActive]}>
              <Text style={[s.roleTabTxt, role === r.key && s.roleTabTxtActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fields */}
        <Text style={s.label}>{current.field === 'phone' ? 'TÉLÉPHONE' : 'EMAIL'}</Text>
        <TextInput style={s.input} value={identifier} onChangeText={setId}
          placeholder={current.field === 'phone' ? '06xxxxxxxx' : 'email@exemple.com'}
          keyboardType={current.field === 'phone' ? 'phone-pad' : 'email-address'}
          autoCapitalize="none" placeholderTextColor="rgba(255,255,255,0.35)" />

        <Text style={s.label}>MOT DE PASSE</Text>
        <TextInput style={s.input} value={password} onChangeText={setPass}
          placeholder="••••••••" secureTextEntry placeholderTextColor="rgba(255,255,255,0.35)" />

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={DARK} /> : <Text style={s.btnTxt}>Se connecter →</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>Pas de compte ? <Text style={s.linkAccent}>S'inscrire</Text></Text>
        </TouchableOpacity>

        {/* Features strip */}
        <View style={s.strip}>
          {[['','30 min'],['','GPS live'],['','Paiement livraison']].map(([icon, label], i) => (
            <View key={i} style={s.stripItem}>
              <Text style={s.stripIcon}>{icon}</Text>
              <Text style={s.stripLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: DARK },
  scroll:       { flexGrow: 1, padding: 24, paddingTop: 64 },
  brandBox:     { alignItems: 'center', marginBottom: 40 },
  brandIcon:    { width: 54, height: 54, borderRadius: 16, backgroundColor: Y, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  brandEmoji:   { fontSize: 28 },
  brandName:    { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  cityBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  cityDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  cityText:     { fontSize: 12, fontWeight: '700', color: Y },
  title:        { fontSize: 34, fontWeight: '900', color: '#fff', lineHeight: 40, letterSpacing: -1, marginBottom: 10 },
  accent:       { color: Y },
  sub:          { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 20 },
  roleTabs:     { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 4, marginBottom: 28, gap: 4 },
  roleTab:      { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  roleTabActive:{ backgroundColor: Y },
  roleTabTxt:   { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.45)' },
  roleTabTxtActive: { color: DARK },
  label:        { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, marginBottom: 8 },
  input:        { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#fff', marginBottom: 18 },
  btn:          { backgroundColor: Y, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  btnTxt:       { color: DARK, fontSize: 16, fontWeight: '800' },
  link:         { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 40 },
  linkAccent:   { color: Y, fontWeight: '700' },
  strip:        { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 24 },
  stripItem:    { alignItems: 'center', gap: 6 },
  stripIcon:    { fontSize: 20 },
  stripLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
});
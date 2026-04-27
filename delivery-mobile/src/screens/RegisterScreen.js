import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import api from '../api/api';
import useAuthStore from '../store/authStore';

const Y = '#F59E0B', F = '#D97706', DARK = '#1A1A18'
const VEHICLES = ['Moto', 'Vélo', 'Voiture', 'Camionnette'];
const VEHICLE_ICONS = { Moto: '', Vélo: '', Voiture: '', Camionnette: '' };

export default function RegisterScreen({ navigation }) {
  const [role,     setRole]    = useState('client');
  const [name,     setName]    = useState('');
  const [email,    setEmail]   = useState('');
  const [phone,    setPhone]   = useState('');
  const [vehicle,  setVehicle] = useState('');
  const [password, setPass]    = useState('');
  const [confirm,  setConfirm] = useState('');
  const [loading,  setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !password) return Alert.alert('Erreur', 'Remplissez tous les champs obligatoires');
    if (password !== confirm) return Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
    setLoading(true);
    try {
      const body = { name, password, role };
      if (email)   body.email   = email;
      if (phone)   body.phone   = phone;
      if (vehicle) body.vehicle = vehicle;
      const { data } = await api.post('/auth/register', body);
      await login(data.token, data.user);
      if (data.user.role === 'driver') navigation.replace('Home');
      else navigation.replace('ClientTracking');
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.error || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Text style={s.backTxt}>← Retour</Text>
      </TouchableOpacity>

      {/* Brand mini */}
      <View style={s.brandRow}>
        <View style={s.brandIcon}><Text style={{ fontSize: 18 }}></Text></View>
        <Text style={s.brandName}>DelivTrack</Text>
      </View>

      <Text style={s.title}>Créer un compte</Text>
      <Text style={s.sub}>Rejoignez-nous gratuitement</Text>

      {/* Role tabs */}
      <View style={s.roleTabs}>
        {[{ key: 'client', label: ' Client', desc: 'Je commande' }, { key: 'driver', label: ' Livreur', desc: 'Je livre' }].map(r => (
          <TouchableOpacity key={r.key} onPress={() => { setRole(r.key); setVehicle(''); }}
            style={[s.roleTab, role === r.key && s.roleTabActive]}>
            <Text style={[s.roleTabLabel, role === r.key && s.roleTabLabelActive]}>{r.label}</Text>
            <Text style={[s.roleTabDesc, role === r.key && { color: DARK }]}>{r.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fields */}
      <Field label="NOM COMPLET *" value={name} onChange={setName} placeholder="Prénom Nom" />
      {role === 'client' && <Field label="EMAIL *" value={email} onChange={setEmail} placeholder="email@exemple.com" type="email-address" />}
      <Field label={role === 'driver' ? 'TÉLÉPHONE *' : 'TÉLÉPHONE'} value={phone} onChange={setPhone} placeholder="06xxxxxxxx" type="phone-pad" />

      {/* Vehicle picker */}
      {role === 'driver' && (
        <View style={s.fieldWrap}>
          <Text style={s.label}>VÉHICULE *</Text>
          <View style={s.vehicleGrid}>
            {VEHICLES.map(v => (
              <TouchableOpacity key={v} onPress={() => setVehicle(v)}
                style={[s.vehicleBtn, vehicle === v && s.vehicleBtnActive]}>
                <Text style={s.vehicleIcon}>{VEHICLE_ICONS[v]}</Text>
                <Text style={[s.vehicleTxt, vehicle === v && s.vehicleTxtActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Field label="MOT DE PASSE *" value={password} onChange={setPass} placeholder="Min. 6 caractères" secure />
      <Field label="CONFIRMER *" value={confirm} onChange={setConfirm} placeholder="••••••••" secure />

      <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color={DARK} /> : <Text style={s.btnTxt}>Créer mon compte →</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={s.link}>Déjà un compte ? <Text style={s.linkAccent}>Se connecter</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value, onChange, placeholder, type = 'default', secure = false }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChange}
        placeholder={placeholder} keyboardType={type} secureTextEntry={secure}
        autoCapitalize="none" placeholderTextColor="#9CA3AF" />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#FAFAF8' },
  scroll:  { padding: 24, paddingTop: 52, paddingBottom: 40 },
  backBtn: { marginBottom: 24 },
  backTxt: { fontSize: 14, color: F, fontWeight: '700' },
  brandRow:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  brandIcon:{ width: 36, height: 36, borderRadius: 10, backgroundColor: Y, alignItems: 'center', justifyContent: 'center' },
  brandName:{ fontSize: 18, fontWeight: '800', color: DARK },
  title:   { fontSize: 28, fontWeight: '900', color: DARK, letterSpacing: -0.5, marginBottom: 6 },
  sub:     { fontSize: 14, color: '#888', marginBottom: 28 },
  roleTabs:{ flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleTab: { flex: 1, padding: 14, borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center' },
  roleTabActive:{ borderColor: Y, backgroundColor: Y },
  roleTabLabel:{ fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 2 },
  roleTabLabelActive:{ color: DARK },
  roleTabDesc:{ fontSize: 11, color: '#CCC' },
  fieldWrap:{ marginBottom: 18 },
  label:   { fontSize: 11, fontWeight: '800', color: '#888', letterSpacing: 1.5, marginBottom: 8 },
  input:   { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: DARK },
  vehicleGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vehicleBtn:{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', minWidth: 80 },
  vehicleBtnActive:{ borderColor: Y, backgroundColor: '#FFFBEB' },
  vehicleIcon:{ fontSize: 20, marginBottom: 4 },
  vehicleTxt:{ fontSize: 12, fontWeight: '600', color: '#888' },
  vehicleTxtActive:{ color: F, fontWeight: '800' },
  btn:     { backgroundColor: Y, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20, marginTop: 8 },
  btnTxt:  { color: DARK, fontSize: 16, fontWeight: '800' },
  link:    { textAlign: 'center', fontSize: 13, color: '#AAA', marginBottom: 20 },
  linkAccent:{ color: F, fontWeight: '700' },
});
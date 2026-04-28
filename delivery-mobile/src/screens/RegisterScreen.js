import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import api from '../api/api';
import useAuthStore from '../store/authStore';

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  brand:    '#FF6B35',
  dark:     '#1A1A2E',
  bg:       '#F7F8FA',
  card:     '#FFFFFF',
  border:   '#EDEEF2',
  textPrimary:   '#1A1A2E',
  textSecondary: '#8A8FA8',
  green:    '#00B14F',
}

const VEHICLES = ['Moto', 'Velo', 'Voiture', 'Camionnette'];

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Text style={s.backTxt}>← Retour</Text>
      </TouchableOpacity>

      {/* Brand */}
      <View style={s.brandRow}>
        <View style={s.brandIcon}>
          <View style={s.brandIconInner} />
        </View>
        <Text style={s.brandName}>DelivTrack</Text>
      </View>

      <Text style={s.title}>Créer un compte</Text>
      <Text style={s.sub}>Rejoignez-nous gratuitement</Text>

      {/* Role tabs */}
      <View style={s.roleTabs}>
        {[
          { key: 'client', label: 'Client',  desc: 'Je commande' },
          { key: 'driver', label: 'Livreur', desc: 'Je livre' },
        ].map(r => (
          <TouchableOpacity
            key={r.key}
            onPress={() => { setRole(r.key); setVehicle(''); }}
            style={[s.roleTab, role === r.key && s.roleTabActive]}
          >
            <Text style={[s.roleTabLabel, role === r.key && s.roleTabLabelActive]}>
              {r.label}
            </Text>
            <Text style={[s.roleTabDesc, role === r.key && { color: '#fff' }]}>
              {r.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fields */}
      <Field label="NOM COMPLET *" value={name} onChange={setName} placeholder="Prenom Nom" />

      {role === 'client' && (
        <Field
          label="EMAIL *"
          value={email}
          onChange={setEmail}
          placeholder="email@exemple.com"
          type="email-address"
        />
      )}

      <Field
        label={role === 'driver' ? 'TELEPHONE *' : 'TELEPHONE'}
        value={phone}
        onChange={setPhone}
        placeholder="06xxxxxxxx"
        type="phone-pad"
      />

      {/* Vehicle picker */}
      {role === 'driver' && (
        <View style={s.fieldWrap}>
          <Text style={s.label}>VEHICULE *</Text>
          <View style={s.vehicleGrid}>
            {VEHICLES.map(v => (
              <TouchableOpacity
                key={v}
                onPress={() => setVehicle(v)}
                style={[s.vehicleBtn, vehicle === v && s.vehicleBtnActive]}
              >
                <View style={[s.vehicleDot, vehicle === v && { backgroundColor: C.brand }]} />
                <Text style={[s.vehicleTxt, vehicle === v && s.vehicleTxtActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Field label="MOT DE PASSE *" value={password} onChange={setPass} placeholder="Min. 6 caracteres" secure />
      <Field label="CONFIRMER *" value={confirm} onChange={setConfirm} placeholder="••••••••" secure />

      <TouchableOpacity
        style={[s.btn, loading && { opacity: 0.6 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnTxt}>Creer mon compte</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={s.link}>
          Deja un compte ? <Text style={s.linkAccent}>Se connecter</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value, onChange, placeholder, type = 'default', secure = false }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={type}
        secureTextEntry={secure}
        autoCapitalize="none"
        placeholderTextColor={C.textSecondary}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 24, paddingTop: 52, paddingBottom: 48 },

  backBtn: { marginBottom: 24 },
  backTxt: { fontSize: 14, color: C.brand, fontWeight: '700' },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  brandIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: C.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  brandIconInner: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  brandName: { fontSize: 18, fontWeight: '800', color: C.dark },

  title: { fontSize: 28, fontWeight: '900', color: C.dark, letterSpacing: -0.5, marginBottom: 6 },
  sub:   { fontSize: 14, color: C.textSecondary, marginBottom: 28 },

  roleTabs: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleTab: {
    flex: 1, padding: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.card, alignItems: 'center',
  },
  roleTabActive:      { borderColor: C.brand, backgroundColor: C.brand },
  roleTabLabel:       { fontSize: 15, fontWeight: '800', color: C.textSecondary, marginBottom: 3 },
  roleTabLabelActive: { color: '#fff' },
  roleTabDesc:        { fontSize: 11, color: C.textSecondary, fontWeight: '600' },

  fieldWrap: { marginBottom: 18 },
  label: {
    fontSize: 11, fontWeight: '800', color: C.textSecondary,
    letterSpacing: 1.5, marginBottom: 8,
  },
  input: {
    backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 15, color: C.dark,
  },

  vehicleGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vehicleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.card, minWidth: 80,
  },
  vehicleBtnActive: { borderColor: C.brand, backgroundColor: '#FFF4EF' },
  vehicleDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  vehicleTxt:       { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  vehicleTxtActive: { color: C.brand, fontWeight: '800' },

  btn: {
    backgroundColor: C.brand, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    marginBottom: 20, marginTop: 8,
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  link:       { textAlign: 'center', fontSize: 13, color: C.textSecondary, marginBottom: 20 },
  linkAccent: { color: C.brand, fontWeight: '700' },
});
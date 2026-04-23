import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import api from '../api/api';
import useAuthStore from '../store/authStore';

const VEHICLES = ['Moto', 'Vélo', 'Voiture', 'Camionnette'];

export default function RegisterScreen({ navigation }) {
  const [role,     setRole]    = useState('driver');
  const [name,     setName]    = useState('');
  const [email,    setEmail]   = useState('');
  const [phone,    setPhone]   = useState('');
  const [vehicle,  setVehicle] = useState('');
  const [password, setPass]    = useState('');
  const [confirm,  setConfirm] = useState('');
  const [loading,  setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !password) {
      return Alert.alert('Erreur', 'Remplissez tous les champs obligatoires');
    }
    if (password !== confirm) {
      return Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
    }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backTxt}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Créer un compte</Text>
      <Text style={styles.subtitle}>Choisissez votre rôle</Text>

      <View style={styles.roleRow}>
        {['driver', 'client'].map(r => (
          <TouchableOpacity key={r}
            style={[styles.roleBtn, role === r && styles.roleBtnActive]}
            onPress={() => setRole(r)}>
            <Text style={[styles.roleTxt, role === r && styles.roleTxtActive]}>
              {r === 'driver' ? 'Livreur' : 'Client'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field label="Nom complet *" value={name} onChange={setName} placeholder="Prénom Nom" />

      {(role === 'client') && (
        <Field label="Email *" value={email} onChange={setEmail}
          placeholder="email@exemple.com" type="email-address" />
      )}

      <Field label={role === 'driver' ? 'Téléphone *' : 'Téléphone'}
        value={phone} onChange={setPhone} placeholder="06xxxxxxxx" type="phone-pad" />

      {role === 'driver' && (
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Véhicule *</Text>
          <View style={styles.vehicleRow}>
            {VEHICLES.map(v => (
              <TouchableOpacity key={v}
                style={[styles.vehicleBtn, vehicle === v && styles.vehicleBtnActive]}
                onPress={() => setVehicle(v)}>
                <Text style={[styles.vehicleTxt, vehicle === v && styles.vehicleTxtActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Field label="Mot de passe *" value={password} onChange={setPass}
        placeholder="Min. 6 caractères" secure />
      <Field label="Confirmer *" value={confirm} onChange={setConfirm}
        placeholder="••••••••" secure />

      <TouchableOpacity
        style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
        onPress={handleRegister} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnPrimaryTxt}>Créer mon compte</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkTxt}>Déjà un compte ? <Text style={styles.link}>Se connecter</Text></Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function Field({ label, value, onChange, placeholder, type = 'default', secure = false }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={type}
        secureTextEntry={secure}
        autoCapitalize="none"
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F8FAFC' },
  scroll:     { padding: 24, paddingTop: 40 },
  back:       { marginBottom: 20 },
  backTxt:    { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  title:      { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle:   { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  roleRow:    { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 20 },
  roleBtn:    { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#fff', elevation: 2 },
  roleTxt:    { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  roleTxtActive: { color: '#2563EB', fontWeight: '700' },
  fieldWrap:  { marginBottom: 14 },
  label:      { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:      { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: '#111827' },
  vehicleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vehicleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  vehicleBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  vehicleTxt: { fontSize: 13, color: '#6B7280' },
  vehicleTxtActive: { color: '#2563EB', fontWeight: '700' },
  btnPrimary: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  linkTxt:    { textAlign: 'center', fontSize: 13, color: '#9CA3AF' },
  link:       { color: '#2563EB', fontWeight: '700' },
});
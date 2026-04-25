import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import api from '../api/api';
import useAuthStore from '../store/authStore';

const ROLES = [
  { key: 'driver',  label: 'Livreur',      field: 'phone' },
  { key: 'client',  label: 'Client',       field: 'email' },
 
];

export default function LoginScreen({ navigation }) {
  const [role,       setRole]    = useState('driver');
  const [identifier, setId]      = useState('');
  const [password,   setPass]    = useState('');
  const [loading,    setLoading] = useState(false);
  const { login } = useAuthStore();

  const current = ROLES.find(r => r.key === role);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>DT</Text>
        </View>
        <Text style={styles.title}>DelivTrack</Text>
        <Text style={styles.subtitle}>Connexion à votre espace</Text>

        {/* Sélecteur rôle */}
        <View style={styles.roleRow}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
              onPress={() => { setRole(r.key); setId(''); }}
            >
              <Text style={[styles.roleTxt, role === r.key && styles.roleTxtActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Champs */}
        <Text style={styles.label}>
          {current.field === 'phone' ? 'Téléphone' : 'Email'}
        </Text>
        <TextInput
          style={styles.input}
          value={identifier}
          onChangeText={setId}
          placeholder={current.field === 'phone' ? '06xxxxxxxx' : 'email@exemple.com'}
          keyboardType={current.field === 'phone' ? 'phone-pad' : 'email-address'}
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPass}
          placeholder="••••••••"
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnPrimaryTxt}>Se connecter</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkTxt}>Pas de compte ? <Text style={styles.link}>S'inscrire</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F8FAFC' },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoBox:    { width: 56, height: 56, borderRadius: 16, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  logoText:   { color: '#fff', fontSize: 20, fontWeight: '800' },
  title:      { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 4 },
  subtitle:   { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 28 },
  roleRow:    { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 20 },
  roleBtn:    { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  roleTxt:    { fontSize: 12, fontWeight: '500', color: '#9CA3AF' },
  roleTxtActive: { color: '#2563EB', fontWeight: '700' },
  label:      { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:      { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: '#111827', marginBottom: 14 },
  btnPrimary: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  linkTxt:    { textAlign: 'center', fontSize: 13, color: '#9CA3AF' },
  link:       { color: '#2563EB', fontWeight: '700' },
});
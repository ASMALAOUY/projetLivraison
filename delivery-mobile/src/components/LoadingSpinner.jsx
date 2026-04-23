import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'

export default function LoadingSpinner({ text = 'Chargement…' }) {
  return (
    <View style={s.wrap}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={s.txt}>{text}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  txt:  { fontSize: 14, color: '#9CA3AF' },
})
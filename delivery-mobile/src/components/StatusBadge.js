import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const CONFIG = {
  pending:     { bg: '#F3F4F6', text: '#374151', label: 'En attente' },
  in_progress: { bg: '#DBEAFE', text: '#1D4ED8', label: 'En cours'   },
  delivered:   { bg: '#DCFCE7', text: '#15803D', label: 'Livré'      },
  failed:      { bg: '#FEE2E2', text: '#DC2626', label: 'Échec'      },
  planned:     { bg: '#EDE9FE', text: '#7C3AED', label: 'Planifié'   },
  done:        { bg: '#CCFBF1', text: '#0F766E', label: 'Terminé'    },
  active:      { bg: '#DCFCE7', text: '#15803D', label: 'Actif'      },
  inactive:    { bg: '#F3F4F6', text: '#6B7280', label: 'Inactif'    },
}

export default function StatusBadge({ status, size = 'md' }) {
  const c = CONFIG[status] || { bg: '#F3F4F6', text: '#374151', label: status }
  const fontSize = size === 'sm' ? 10 : 12
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.text, { color: c.text, fontSize }]}>{c.label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start' },
  text:  { fontWeight: '700' },
})
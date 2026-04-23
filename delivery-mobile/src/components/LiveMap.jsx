import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native'
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service'
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions'
import { Platform } from 'react-native'

export default function LiveMap({ driverId, destLat, destLng, destLabel }) {
  const [driverLocation, setDriverLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    requestLocationPermission()
  }, [])

  const requestLocationPermission = async () => {
    const permission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION

    const result = await request(permission)
    
    if (result === RESULTS.GRANTED) {
      getDriverLocation()
    } else {
      setLoading(false)
    }
  }

  const getDriverLocation = () => {
    // Simuler la position du livreur (à remplacer par API réelle)
    setDriverLocation({
      latitude: destLat || 31.6295,
      longitude: destLng || -7.9811,
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    )
  }

  const initialRegion = driverLocation ? {
    latitude: driverLocation.latitude,
    longitude: driverLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : {
    latitude: destLat || 31.6295,
    longitude: destLng || -7.9811,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.gpsIndicator}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsText}>Suivi GPS en direct</Text>
        </View>
        {driverLocation && (
          <Text style={styles.gpsStatus}>● Livreur localisé</Text>
        )}
      </View>

      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Livreur"
            description="Position actuelle du livreur"
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverIcon}>🛵</Text>
            </View>
          </Marker>
        )}

        {destLat && destLng && (
          <Marker
            coordinate={{ latitude: destLat, longitude: destLng }}
            title="Destination"
            description={destLabel}
          >
            <View style={styles.destMarker}>
              <Text style={styles.destIcon}>🏠</Text>
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Mis à jour en temps réel</Text>
        {driverLocation && (
          <Text style={styles.coords}>
            📍 {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  gpsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  gpsStatus: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  map: {
    height: 280,
    width: '100%',
  },
  driverMarker: {
    backgroundColor: '#2563EB',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  driverIcon: {
    fontSize: 20,
  },
  destMarker: {
    backgroundColor: '#EF4444',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  destIcon: {
    fontSize: 15,
    transform: [{ rotate: '45deg' }],
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  coords: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  loadingContainer: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
  },
})
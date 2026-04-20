import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import api from '../api/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const driverIcon = L.divIcon({
  html: `<div style="background:#2563EB;width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🚴</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: '',
})

const destIcon = L.divIcon({
  html: `<div style="background:#EF4444;width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏠</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  className: '',
})

export default function LiveDriverMap({ driverId, destinationLat, destinationLng, destinationLabel }) {
  const [driverPos, setDriverPos] = useState(null)
  const [history,   setHistory]   = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchPosition = async () => {
    if (!driverId) return
    try {
      const { data } = await api.get(`/tracking/position/${driverId}`)
      if (data && data.latitude) {
        setDriverPos({ lat: data.latitude, lng: data.longitude })
        setLastUpdate(new Date().toLocaleTimeString())
      }
    } catch {}
  }

  useEffect(() => {
    fetchPosition()
    const interval = setInterval(fetchPosition, 10000)
    return () => clearInterval(interval)
  }, [driverId])

  const center = driverPos
    ? [driverPos.lat, driverPos.lng]
    : [destinationLat || 31.6295, destinationLng || -7.9811]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-gray-700">Suivi GPS en direct</h2>
        </div>
        {lastUpdate && (
          <span className="text-xs text-gray-400">Mis à jour : {lastUpdate}</span>
        )}
      </div>

      {!driverPos ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">En attente de la position du livreur…</p>
        </div>
      ) : (
        <div style={{ height: 280 }}>
          <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Position du livreur */}
            <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
              <Popup>
                <p className="font-semibold text-sm">Votre livreur</p>
                <p className="text-xs text-gray-500">En route vers vous</p>
              </Popup>
            </Marker>

            {/* Destination (chez le client) */}
            {destinationLat && destinationLng && (
              <Marker position={[destinationLat, destinationLng]} icon={destIcon}>
                <Popup>
                  <p className="font-semibold text-sm">Votre adresse</p>
                  <p className="text-xs text-gray-500">{destinationLabel}</p>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      )}

      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 text-xs text-gray-500">
        <span className="flex items-center gap-1">🚴 Livreur</span>
        <span className="flex items-center gap-1">🏠 Votre adresse</span>
        <span className="ml-auto">Actualisation toutes les 10s</span>
      </div>
    </div>
  )
}
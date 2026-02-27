import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

export default function MapPicker({ onChange, initialLat = 20.5937, initialLng = 78.9629 }) {
  const [position, setPosition] = useState(null)

  const handleClick = (lat, lng) => {
    setPosition([lat, lng])
    if (onChange) onChange(lat, lng)
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
        📍 Click on the map to set the issue location
        {position && (
          <span className="ml-2 text-indigo-600 font-medium">
            Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
          </span>
        )}
      </div>
      <MapContainer center={[initialLat, initialLng]} zoom={5} style={{ height: '300px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onLocationChange={handleClick} />
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  )
}

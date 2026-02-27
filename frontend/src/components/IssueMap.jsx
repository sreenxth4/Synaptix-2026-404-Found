import React from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const priorityMarkerColors = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

export default function IssueMap({ issues = [] }) {
  const validIssues = issues.filter(i => i.location?.lat && i.location?.lng)

  return (
    <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '400px', width: '100%' }}
      className="rounded-xl overflow-hidden">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validIssues.map((issue) => (
        <CircleMarker
          key={issue._id || issue.id}
          center={[issue.location.lat, issue.location.lng]}
          radius={issue.reports_count ? Math.min(8 + issue.reports_count * 2, 20) : 8}
          pathOptions={{
            color: priorityMarkerColors[issue.severity] || '#6366f1',
            fillColor: priorityMarkerColors[issue.severity] || '#6366f1',
            fillOpacity: 0.7,
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong>{issue.title}</strong>
              <br />
              <span className="text-gray-500">{issue.category}</span>
              <br />
              <span>Status: {issue.status}</span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

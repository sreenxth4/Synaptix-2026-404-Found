import React from 'react'
import { formatDate } from '../utils/helpers.js'

const statusIcons = { open: '🔵', in_progress: '🟠', resolved: '✅' }
const statusColors = {
  open: 'border-blue-400 bg-blue-50',
  in_progress: 'border-orange-400 bg-orange-50',
  resolved: 'border-green-400 bg-green-50',
}

export default function IssueTimeline({ statusLogs = [] }) {
  if (!statusLogs.length) return (
    <div className="text-gray-400 text-sm italic py-4 text-center">No timeline events yet.</div>
  )
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {statusLogs.map((log, i) => (
          <div key={i} className="relative flex gap-4 pl-10">
            <div className="absolute left-1 top-1 w-6 h-6 rounded-full bg-white border-2 border-indigo-300 flex items-center justify-center text-xs">
              {statusIcons[log.status] || '📌'}
            </div>
            <div className={`flex-1 border rounded-lg p-3 ${statusColors[log.status] || 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-700 capitalize">{log.status?.replace('_', ' ')}</span>
                <span className="text-xs text-gray-400">{formatDate(log.timestamp || log.changed_at)}</span>
              </div>
              {log.note && <p className="text-sm text-gray-600 mt-1">{log.note}</p>}
              {log.changed_by_name && <p className="text-xs text-gray-400 mt-1">by {log.changed_by_name}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

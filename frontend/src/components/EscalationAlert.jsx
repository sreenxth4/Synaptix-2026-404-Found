import React from 'react'

export default function EscalationAlert({ count = 0 }) {
  if (!count || count <= 0) return null
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
      <span className="text-xl animate-bounce">🚨</span>
      <div>
        <p className="font-semibold text-sm">Issue Escalated</p>
        <p className="text-xs">This issue has been escalated <strong>{count}</strong> time{count !== 1 ? 's' : ''}. Urgent attention required.</p>
      </div>
      <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">{count}</span>
    </div>
  )
}

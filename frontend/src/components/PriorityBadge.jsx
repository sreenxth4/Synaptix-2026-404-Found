import React from 'react'
import { useTranslation } from 'react-i18next'

export default function PriorityBadge({ priority }) {
  const { t } = useTranslation()
  const styles = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800 animate-pulse',
  }
  const key = priority?.charAt(0).toUpperCase() + priority?.slice(1).toLowerCase()
  const cls = styles[key] || 'bg-gray-100 text-gray-800'
  const label = t(`priority.${priority?.toLowerCase()}`, priority)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {priority?.toLowerCase() === 'critical' && <span className="mr-1">🔴</span>}
      {label}
    </span>
  )
}

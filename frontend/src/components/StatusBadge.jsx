import React from 'react'
import { useTranslation } from 'react-i18next'

export default function StatusBadge({ status }) {
  const { t } = useTranslation()
  const styles = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
  }
  const cls = styles[status] || 'bg-gray-100 text-gray-800'
  const icons = { open: '🔵', in_progress: '🟠', resolved: '✅' }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span>{icons[status]}</span>
      {t(`status.${status}`, status)}
    </span>
  )
}

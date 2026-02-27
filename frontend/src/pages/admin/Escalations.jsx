import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar.jsx'
import PriorityBadge from '../../components/PriorityBadge.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import EscalationAlert from '../../components/EscalationAlert.jsx'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'
import { timeAgo } from '../../utils/helpers.js'

export default function Escalations() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/issues/escalated')
      .then(r => {
        const list = r.data.issues || r.data || []
        const sorted = [...list].sort((a, b) => (b.escalation_count || 0) - (a.escalation_count || 0))
        setIssues(sorted)
      })
      .catch(() => toast.error('Failed to load escalations'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('nav.escalations')}</h1>
          {issues.length > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              {issues.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">{t('common.loading')}</div>
        ) : issues.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-gray-400">No escalated issues. Great work!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map(issue => (
              <div key={issue._id || issue.id}
                className="bg-white rounded-xl border border-red-100 p-5 shadow-sm hover:shadow-md cursor-pointer transition-all"
                onClick={() => navigate(`/admin/issues/${issue._id || issue.id}`)}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{issue.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{issue.category} · {issue.location_address} · {timeAgo(issue.created_at)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <PriorityBadge priority={issue.severity} />
                    <StatusBadge status={issue.status} />
                  </div>
                </div>
                <EscalationAlert count={issue.escalation_count} />
                {issue.department_name && (
                  <p className="text-xs text-gray-500 mt-2">🏢 Responsible: <strong>{issue.department_name}</strong></p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar.jsx'
import SLATimer from '../../components/SLATimer.jsx'
import PriorityBadge from '../../components/PriorityBadge.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const STATUS_FILTERS = ['all', 'open', 'in_progress', 'resolved']

export default function AuthorityDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [issues, setIssues] = useState([])
  const [filter, setFilter] = useState('all')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/issues/assigned').catch(() => ({ data: { issues: [] } })),
      api.get('/api/analytics/department').catch(() => ({ data: null })),
    ]).then(([issuesRes, analyticsRes]) => {
      const issueList = issuesRes.data.issues || issuesRes.data || []
      const sorted = [...issueList].sort((a, b) =>
        (PRIORITY_ORDER[a.severity] ?? 4) - (PRIORITY_ORDER[b.severity] ?? 4)
      )
      setIssues(sorted)
      setAnalytics(analyticsRes.data)
    }).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Issue Queue</h1>
          <span className="text-sm text-gray-400">{filtered.length} issue{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Assigned', value: analytics.total_issues, icon: '📋' },
              { label: 'Resolved', value: analytics.resolved_issues, icon: '✅' },
              { label: 'Resolution Rate', value: `${analytics.resolution_rate?.toFixed(1) || 0}%`, icon: '📊' },
              { label: 'Avg Response', value: `${analytics.avg_time_hours?.toFixed(1) || 0}h`, icon: '⏱️' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-gray-400 text-xs">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
                <span className="text-xl">{s.icon}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {s === 'all' ? t('common.all') : t(`status.${s}`, s)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-gray-400">No issues in queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(issue => (
              <div key={issue._id || issue.id}
                onClick={() => navigate(`/authority/issues/${issue._id || issue.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{issue.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{issue.category} · {issue.location_address}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={issue.severity} />
                  <StatusBadge status={issue.status} />
                  {issue.sla_deadline && <SLATimer sla_deadline={issue.sla_deadline} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

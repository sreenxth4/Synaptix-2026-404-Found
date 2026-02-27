import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar.jsx'
import IssueCard from '../../components/IssueCard.jsx'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

function StatCard({ label, value, icon, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500 to-indigo-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function CitizenDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [issues, setIssues] = useState([])
  const [stats, setStats] = useState({ total: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/issues/my').catch(() => ({ data: { issues: [] } })),
    ]).then(([issuesRes]) => {
      const issueList = issuesRes.data.issues || issuesRes.data || []
      setIssues(issueList.slice(0, 5))
      setStats({
        total: issueList.length,
        resolved: issueList.filter(i => i.status === 'resolved').length,
      })
    }).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false))
  }, [])

  const points = user?.civic_points || 0
  const getBadge = () => {
    if (points >= 1000) return { label: t('citizen.badge.civicHero'), icon: '🏆', color: 'text-yellow-600' }
    if (points >= 100) return { label: t('citizen.badge.activeReporter'), icon: '⭐', color: 'text-blue-600' }
    return { label: t('citizen.badge.newcomer'), icon: '🌱', color: 'text-green-600' }
  }
  const badge = getBadge()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t('citizen.welcome')}, {user?.name}! 👋</h1>
              <p className="text-indigo-100 mt-1">Thank you for making your city better.</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
                <span className="text-xl">{badge.icon}</span>
                <span className="font-semibold">{badge.label}</span>
              </div>
            </div>
            <div className="text-center hidden md:block">
              <div className="text-4xl font-bold">{points}</div>
              <div className="text-indigo-200 text-sm">{t('citizen.points')}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label={t('citizen.totalIssues')} value={stats.total} icon="📋" color="indigo" />
          <StatCard label={t('citizen.resolvedIssues')} value={stats.resolved} icon="✅" color="green" />
          <StatCard label={t('citizen.points')} value={points} icon="🏅" color="yellow" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Issues</h2>
          <Link to="/citizen/report"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            + {t('citizen.reportNew')}
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">{t('common.loading')}</div>
        ) : issues.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">No issues reported yet.</p>
            <Link to="/citizen/report"
              className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              Report Your First Issue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.map(issue => <IssueCard key={issue._id || issue.id} issue={issue} />)}
          </div>
        )}
      </div>
    </div>
  )
}

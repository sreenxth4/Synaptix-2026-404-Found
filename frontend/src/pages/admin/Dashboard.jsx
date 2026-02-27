import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar.jsx'
import IssueMap from '../../components/IssueMap.jsx'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

function StatCard({ label, value, icon, gradient }) {
  return (
    <div className={`${gradient} rounded-2xl p-5 text-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl opacity-80">{icon}</span>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [deptStats, setDeptStats] = useState([])
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/analytics/overview').catch(() => ({ data: null })),
      api.get('/api/analytics/departments').catch(() => ({ data: { departments: [] } })),
      api.get('/api/issues?limit=100').catch(() => ({ data: { issues: [] } })),
    ]).then(([statsRes, deptRes, issuesRes]) => {
      setStats(statsRes.data)
      setDeptStats(deptRes.data.departments || deptRes.data || [])
      setIssues(issuesRes.data.issues || issuesRes.data || [])
    }).catch(() => toast.error('Failed to load analytics')).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Admin Overview</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label={t('admin.totalIssues')} value={stats?.total_issues ?? '—'} icon="📋"
            gradient="bg-gradient-to-br from-indigo-500 to-indigo-700" />
          <StatCard label={t('admin.resolvedIssues')} value={stats?.resolved_issues ?? '—'} icon="✅"
            gradient="bg-gradient-to-br from-green-500 to-green-700" />
          <StatCard label={t('admin.escalatedIssues')} value={stats?.escalated_issues ?? '—'} icon="🚨"
            gradient="bg-gradient-to-br from-red-500 to-red-700" />
          <StatCard label={t('admin.activeCitizens')} value={stats?.active_citizens ?? '—'} icon="👥"
            gradient="bg-gradient-to-br from-purple-500 to-purple-700" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="font-bold text-gray-800 mb-4">🗺️ Issue Heatmap</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">{t('common.loading')}</div>
          ) : (
            <IssueMap issues={issues} />
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4">🏢 Department Performance</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>
          ) : deptStats.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No department data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-3 font-semibold text-gray-600">Department</th>
                    <th className="pb-3 font-semibold text-gray-600">Total Issues</th>
                    <th className="pb-3 font-semibold text-gray-600">Resolved</th>
                    <th className="pb-3 font-semibold text-gray-600">Resolution Rate</th>
                    <th className="pb-3 font-semibold text-gray-600">Avg Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deptStats.map((dept, i) => (
                    <tr key={dept._id || i} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{dept.name || dept.department_name}</td>
                      <td className="py-3 text-gray-600">{dept.total_issues}</td>
                      <td className="py-3 text-gray-600">{dept.resolved_issues}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 w-20">
                            <div className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${dept.resolution_rate || 0}%` }} />
                          </div>
                          <span className="text-gray-700 font-medium">{dept.resolution_rate?.toFixed(1) || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">{dept.avg_time_hours?.toFixed(1) || 'N/A'}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

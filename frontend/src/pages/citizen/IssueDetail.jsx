import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar.jsx'
import PriorityBadge from '../../components/PriorityBadge.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import IssueTimeline from '../../components/IssueTimeline.jsx'
import EscalationAlert from '../../components/EscalationAlert.jsx'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/helpers.js'

export default function CitizenIssueDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upvoting, setUpvoting] = useState(false)

  const fetchIssue = useCallback(async () => {
    try {
      const res = await api.get(`/api/issues/${id}`)
      setIssue(res.data.issue || res.data)
    } catch {
      toast.error('Failed to load issue')
      navigate('/citizen/my-issues')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { fetchIssue() }, [fetchIssue])

  const handleUpvote = async () => {
    setUpvoting(true)
    try {
      await api.post(`/api/issues/${id}/upvote`)
      toast.success('Upvoted!')
      fetchIssue()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upvote')
    } finally {
      setUpvoting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center h-64 text-gray-400">{t('common.loading')}</div>
    </div>
  )
  if (!issue) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm mb-4 hover:underline">← Back</button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-gray-800 leading-tight">{issue.title}</h1>
            <div className="flex flex-col gap-2 shrink-0">
              <PriorityBadge priority={issue.severity || issue.priority} />
              <StatusBadge status={issue.status} />
            </div>
          </div>

          <EscalationAlert count={issue.escalation_count} />

          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p><span className="font-medium text-gray-700">{t('issue.category')}:</span> {issue.category}</p>
            {issue.location_address && <p><span className="font-medium text-gray-700">Location:</span> 📍 {issue.location_address}</p>}
            <p><span className="font-medium text-gray-700">{t('issue.createdAt')}:</span> {formatDate(issue.created_at || issue.createdAt)}</p>
            <p className="text-gray-700 leading-relaxed mt-3">{issue.description}</p>
          </div>

          {issue.image_url && (
            <img src={issue.image_url} alt="Issue" className="mt-4 rounded-xl w-full max-h-64 object-cover border border-gray-200" />
          )}

          <div className="mt-6 flex items-center gap-4">
            <button onClick={handleUpvote} disabled={upvoting}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
              👍 Upvote ({issue.upvotes || 0})
            </button>
            {issue.reports_count > 0 && (
              <span className="text-sm text-gray-400">👥 {issue.reports_count} people reported this</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4">📋 Status Timeline</h2>
          <IssueTimeline statusLogs={issue.status_logs || issue.statusLogs || []} />
        </div>
      </div>
    </div>
  )
}

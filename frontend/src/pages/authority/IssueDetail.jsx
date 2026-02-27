import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar.jsx'
import PriorityBadge from '../../components/PriorityBadge.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import IssueTimeline from '../../components/IssueTimeline.jsx'
import EscalationAlert from '../../components/EscalationAlert.jsx'
import SLATimer from '../../components/SLATimer.jsx'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils/helpers.js'

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved']

export default function AuthorityIssueDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [issue, setIssue] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [updateForm, setUpdateForm] = useState({ status: '', note: '' })
  const [proof, setProof] = useState(null)

  const fetchIssue = useCallback(async () => {
    try {
      const res = await api.get(`/api/issues/${id}`)
      const issueData = res.data.issue || res.data
      setIssue(issueData)
      setTimeline(res.data.timeline || [])
      setUpdateForm(f => ({ ...f, status: issueData.status }))
    } catch {
      toast.error('Failed to load issue')
      navigate('/authority/dashboard')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { fetchIssue() }, [fetchIssue])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const formData = new FormData()
      formData.append('status', updateForm.status)
      if (updateForm.note) formData.append('note', updateForm.note)
      if (proof) formData.append('proof_image', proof)

      await api.put(`/api/issues/${id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Issue updated successfully!')
      fetchIssue()
      setUpdateForm(f => ({ ...f, note: '' }))
      setProof(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update issue')
    } finally {
      setUpdating(false)
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
            <h1 className="text-xl font-bold text-gray-800">{issue.title}</h1>
            <div className="flex flex-col gap-2 shrink-0">
              <PriorityBadge priority={issue.priority_label || issue.severity || issue.priority} />
              <StatusBadge status={issue.status} />
            </div>
          </div>

          <EscalationAlert count={issue.escalation_count} />

          {issue.sla_deadline && (
            <div className="mt-3">
              <SLATimer sla_deadline={issue.sla_deadline} />
            </div>
          )}

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p><span className="font-medium text-gray-700">Category:</span> {issue.category}</p>
            {issue.location_address && <p><span className="font-medium text-gray-700">Location:</span> 📍 {issue.location_address}</p>}
            <p><span className="font-medium text-gray-700">Reported:</span> {formatDate(issue.created_at || issue.createdAt)}</p>
            <p><span className="font-medium text-gray-700">Reports:</span> 👥 {issue.reports_count || 1} citizen(s)</p>
            <p className="text-gray-700 leading-relaxed mt-3">{issue.description}</p>
          </div>

          {issue.image_url && (
            <img src={issue.image_url} alt="Issue" className="mt-4 rounded-xl w-full max-h-64 object-cover border border-gray-200" />
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">✏️ Update Status</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
              <select value={updateForm.status}
                onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{t(`status.${s}`, s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note / Update</label>
              <textarea value={updateForm.note}
                onChange={e => setUpdateForm(f => ({ ...f, note: e.target.value }))}
                rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Add a note about this status update..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proof Image (optional)</label>
              <input type="file" accept="image/*" onChange={e => setProof(e.target.files[0])}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>
            <button type="submit" disabled={updating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
              {updating ? t('common.loading') : '💾 Update Issue'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-4">📋 Status Timeline</h2>
          <IssueTimeline statusLogs={timeline} />
        </div>
      </div>
    </div>
  )
}

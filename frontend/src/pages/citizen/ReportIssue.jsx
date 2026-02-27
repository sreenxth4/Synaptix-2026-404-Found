import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar.jsx'
import MapPicker from '../../components/MapPicker.jsx'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

const CATEGORIES = ['Roads', 'Water', 'Electricity', 'Sanitation', 'Public Safety', 'Environment', 'Other']
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export default function ReportIssue() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', category: '', severity: 'Medium', location_address: '',
  })
  const [location, setLocation] = useState({ lat: null, lng: null })
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [clusterInfo, setClusterInfo] = useState(null)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleMapChange = (lat, lng) => setLocation({ lat, lng })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.category) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      if (location.lat) {
        formData.append('latitude', location.lat)
        formData.append('longitude', location.lng)
      }
      if (image) formData.append('image', image)

      const res = await api.post('/api/issues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.cluster_info) setClusterInfo(res.data.cluster_info)
      toast.success('Issue reported successfully!')
      setTimeout(() => navigate('/citizen/my-issues'), 1500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report issue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Report a Civic Issue</h1>
          <p className="text-gray-500 text-sm mt-1">Help improve your community by reporting issues</p>
        </div>

        {clusterInfo && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 text-sm text-indigo-700">
            🔗 This issue was clustered with <strong>{clusterInfo.count}</strong> existing reports in your area.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('issue.title')} *</label>
              <input type="text" required value={form.title} onChange={set('title')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief title of the issue" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('issue.description')} *</label>
              <textarea required value={form.description} onChange={set('description')} rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Detailed description of the problem..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('issue.category')} *</label>
                <select required value={form.category} onChange={set('category')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('issue.priority')}</label>
                <select value={form.severity} onChange={set('severity')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('issue.location')}</label>
              <input type="text" value={form.location_address} onChange={set('location_address')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                placeholder="Street address or landmark" />
              <MapPicker onChange={handleMapChange} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
              <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
                {loading ? t('common.loading') : '🚀 ' + t('common.submit')}
              </button>
              <button type="button" onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

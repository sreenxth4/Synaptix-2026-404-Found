import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar.jsx'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

export default function Departments() {
  const { t } = useTranslation()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', email: '' })

  const fetchDepts = () => {
    api.get('/api/departments')
      .then(r => setDepartments(r.data.departments || r.data || []))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDepts() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/api/departments', form)
      toast.success('Department created!')
      setForm({ name: '', description: '', email: '' })
      setShowForm(false)
      fetchDepts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department')
    } finally {
      setCreating(false)
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('nav.departments')}</h1>
          <button onClick={() => setShowForm(v => !v)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            {showForm ? '✕ Cancel' : '+ New Department'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">Create Department</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={set('name')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Municipal Roads Department" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Department responsibilities..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" value={form.email} onChange={set('email')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="dept@municipality.gov.in" />
              </div>
              <button type="submit" disabled={creating}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {creating ? t('common.loading') : t('common.submit')}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">{t('common.loading')}</div>
        ) : departments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <div className="text-5xl mb-4">🏢</div>
            <p className="text-gray-400">No departments yet. Create one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map(dept => (
              <div key={dept._id || dept.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">{dept.name}</h3>
                    {dept.description && <p className="text-sm text-gray-500 mt-1">{dept.description}</p>}
                    {dept.email && <p className="text-xs text-indigo-600 mt-2">✉️ {dept.email}</p>}
                  </div>
                  <span className="text-2xl">🏢</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
                  <span>👥 {dept.staff_count || 0} staff</span>
                  <span>📋 {dept.issue_count || 0} issues</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

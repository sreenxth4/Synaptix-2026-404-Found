import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import api from '../api/axios.js'

export default function Register() {
  const { register } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'citizen',
    language_preference: 'en', department_id: ''
  })
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (form.role === 'authority') {
      api.get('/api/departments').then(r => setDepartments(r.data.departments || r.data || [])).catch(() => {})
    }
  }, [form.role])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form }
      if (form.role !== 'authority') delete payload.department_id
      const user = await register(payload)
      toast.success('Account created successfully!')
      if (user.role === 'citizen') navigate('/citizen/dashboard')
      else if (user.role === 'authority') navigate('/authority/dashboard')
      else navigate('/admin/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-700 mb-2">🏛️ ResolvIt</h1>
          <p className="text-gray-500">Join the Civic Community</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('auth.register')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.name')}</label>
              <input type="text" required value={form.name} onChange={set('name')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
              <input type="email" required value={form.email} onChange={set('email')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
              <input type="password" required value={form.password} onChange={set('password')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="At least 6 characters" minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.role')}</label>
              <select value={form.role} onChange={set('role')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="citizen">Citizen</option>
                <option value="authority">Authority Official</option>
              </select>
            </div>
            {form.role === 'authority' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.department')}</label>
                <select value={form.department_id} onChange={set('department_id')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.language')}</label>
              <select value={form.language_preference} onChange={set('language_preference')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
              {loading ? t('common.loading') : t('auth.register')}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-medium">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

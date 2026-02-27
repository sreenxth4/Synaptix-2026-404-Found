import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar.jsx'
import IssueCard from '../../components/IssueCard.jsx'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

const STATUS_FILTERS = ['all', 'open', 'in_progress', 'resolved']

export default function MyIssues() {
  const { t } = useTranslation()
  const [issues, setIssues] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/issues/my')
      .then(r => setIssues(r.data.issues || r.data || []))
      .catch(() => toast.error('Failed to load issues'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('nav.myIssues')}</h1>
          <span className="text-sm text-gray-400">{filtered.length} issue{filtered.length !== 1 ? 's' : ''}</span>
        </div>

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
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400">No issues found{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(issue => <IssueCard key={issue._id || issue.id} issue={issue} />)}
          </div>
        )}
      </div>
    </div>
  )
}

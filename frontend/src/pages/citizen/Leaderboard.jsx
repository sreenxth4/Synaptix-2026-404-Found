import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar.jsx'
import LeaderboardTable from '../../components/LeaderboardTable.jsx'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

export default function Leaderboard() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/leaderboard')
      .then(r => setEntries(r.data.leaderboard || r.data || []))
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{t('nav.leaderboard')}</h1>
          <p className="text-gray-400 text-sm mt-1">Top civic champions making a difference</p>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">{t('common.loading')}</div>
        ) : (
          <LeaderboardTable entries={entries.slice(0, 20)} />
        )}
      </div>
    </div>
  )
}

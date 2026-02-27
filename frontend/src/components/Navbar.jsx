import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path
    ? 'bg-indigo-700 text-white'
    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'

  const citizenLinks = [
    { to: '/citizen/dashboard', label: t('nav.dashboard') },
    { to: '/citizen/report', label: t('nav.report') },
    { to: '/citizen/my-issues', label: t('nav.myIssues') },
    { to: '/citizen/leaderboard', label: t('nav.leaderboard') },
  ]
  const authorityLinks = [
    { to: '/authority/dashboard', label: t('nav.queue') },
  ]
  const adminLinks = [
    { to: '/admin/dashboard', label: t('nav.dashboard') },
    { to: '/admin/escalations', label: t('nav.escalations') },
    { to: '/admin/departments', label: t('nav.departments') },
  ]

  const links = user?.role === 'citizen' ? citizenLinks
    : user?.role === 'authority' ? authorityLinks
    : user?.role === 'admin' ? adminLinks : []

  return (
    <nav className="bg-indigo-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <span className="text-white font-bold text-xl tracking-tight">
              🏛️ ResolvIt
            </span>
            <div className="hidden md:flex gap-1">
              {links.map(l => (
                <Link key={l.to} to={l.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(l.to)}`}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-indigo-100 text-sm hidden md:block">
                  {user.name} {user.civic_points > 0 && <span className="text-yellow-300 font-semibold">({user.civic_points} pts)</span>}
                </span>
                <button onClick={handleLogout}
                  className="bg-indigo-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-indigo-900 transition-colors">
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

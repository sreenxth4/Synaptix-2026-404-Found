import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import CitizenDashboard from './pages/citizen/Dashboard.jsx'
import ReportIssue from './pages/citizen/ReportIssue.jsx'
import CitizenIssueDetail from './pages/citizen/IssueDetail.jsx'
import MyIssues from './pages/citizen/MyIssues.jsx'
import Leaderboard from './pages/citizen/Leaderboard.jsx'
import AuthorityDashboard from './pages/authority/Dashboard.jsx'
import AuthorityIssueDetail from './pages/authority/IssueDetail.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import Escalations from './pages/admin/Escalations.jsx'
import Departments from './pages/admin/Departments.jsx'

function ProtectedRoute({ children, role }) {
  const { user, token } = useAuth()
  if (!token || !user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/citizen/dashboard" element={<ProtectedRoute role="citizen"><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/citizen/report" element={<ProtectedRoute role="citizen"><ReportIssue /></ProtectedRoute>} />
        <Route path="/citizen/issues/:id" element={<ProtectedRoute role="citizen"><CitizenIssueDetail /></ProtectedRoute>} />
        <Route path="/citizen/my-issues" element={<ProtectedRoute role="citizen"><MyIssues /></ProtectedRoute>} />
        <Route path="/citizen/leaderboard" element={<ProtectedRoute role="citizen"><Leaderboard /></ProtectedRoute>} />
        <Route path="/authority/dashboard" element={<ProtectedRoute role="authority"><AuthorityDashboard /></ProtectedRoute>} />
        <Route path="/authority/issues/:id" element={<ProtectedRoute role="authority"><AuthorityIssueDetail /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/escalations" element={<ProtectedRoute role="admin"><Escalations /></ProtectedRoute>} />
        <Route path="/admin/departments" element={<ProtectedRoute role="admin"><Departments /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

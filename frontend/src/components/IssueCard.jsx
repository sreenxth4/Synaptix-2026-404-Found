import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import PriorityBadge from './PriorityBadge.jsx'
import StatusBadge from './StatusBadge.jsx'
import { timeAgo } from '../utils/helpers.js'

export default function IssueCard({ issue }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const basePath = user?.role === 'authority' ? '/authority' : '/citizen'

  return (
    <div
      onClick={() => navigate(`${basePath}/issues/${issue._id || issue.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{issue.title}</h3>
        <div className="flex flex-col gap-1 shrink-0">
          <PriorityBadge priority={issue.priority_label || issue.severity || issue.priority} />
          <StatusBadge status={issue.status} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{issue.category}</span>
        {issue.location_address && (
          <span className="flex items-center gap-1">
            📍 <span className="truncate max-w-32">{issue.location_address}</span>
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{timeAgo(issue.created_at || issue.createdAt)}</span>
        <div className="flex items-center gap-3">
          {issue.reports_count > 0 && <span>👥 {issue.reports_count} reports</span>}
          {issue.upvotes_count > 0 && <span>👍 {issue.upvotes_count}</span>}
        </div>
      </div>
    </div>
  )
}
